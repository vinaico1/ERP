const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const authorize = (...modules) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Admin has full access
    if (req.user.role.name === 'admin') {
      return next();
    }

    const permissions = JSON.parse(req.user.role.permissions || '{}');

    const hasPermission = modules.some(module => {
      if (typeof module === 'string') {
        return permissions[module] && permissions[module].includes('read');
      }
      const { module: mod, action } = module;
      return permissions[mod] && permissions[mod].includes(action);
    });

    if (!hasPermission) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }

    next();
  };
};

const authorizeAction = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (req.user.role.name === 'admin') {
      return next();
    }

    const permissions = JSON.parse(req.user.role.permissions || '{}');
    const modulePerms = permissions[module] || [];

    if (!modulePerms.includes(action)) {
      return res.status(403).json({
        error: `Acesso negado. Permissão '${action}' necessária para '${module}'.`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize, authorizeAction };
