const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { auditLog } = require('../../middleware/audit');
const { success, error } = require('../../utils/response');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { token, refreshToken };
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email e senha são obrigatórios');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true }
    });

    if (!user || !user.active) {
      return error(res, 'Credenciais inválidas', 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return error(res, 'Credenciais inválidas', 401);
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const { token, refreshToken } = generateTokens(user);
    await auditLog(user.id, 'login', 'User', user.id, null, null, req);

    const { password: _, ...userSafe } = user;
    return success(res, { token, refreshToken, user: userSafe }, 'Login realizado com sucesso');
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token não fornecido', 401);

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, include: { role: true } });

    if (!user || !user.active) return error(res, 'Usuário inválido', 401);

    const tokens = generateTokens(user);
    return success(res, tokens, 'Token renovado com sucesso');
  } catch (err) {
    return error(res, 'Refresh token inválido ou expirado', 401);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await auditLog(req.user.id, 'logout', 'User', req.user.id, null, null, req);
    return success(res, null, 'Logout realizado com sucesso');
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const { password: _, ...userSafe } = req.user;
    return success(res, userSafe);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return error(res, 'Senha atual e nova senha são obrigatórias');
    }
    if (newPassword.length < 6) {
      return error(res, 'Nova senha deve ter ao menos 6 caracteres');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return error(res, 'Senha atual incorreta');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    await auditLog(req.user.id, 'change_password', 'User', req.user.id, null, null, req);

    return success(res, null, 'Senha alterada com sucesso');
  } catch (err) {
    next(err);
  }
};
