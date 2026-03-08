const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, active } = req.query;

    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    if (active !== undefined) where.active = active === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, include: { role: true }, orderBy: { name: 'asc' } }),
      prisma.user.count({ where })
    ]);

    const safe = users.map(({ password, ...u }) => u);
    return paginated(res, safe, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { role: true } });
    if (!user) return error(res, 'Usuário não encontrado', 404);
    const { password, ...safe } = user;
    return success(res, safe);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, roleId } = req.body;
    if (!name || !email || !password || !roleId) {
      return error(res, 'Nome, email, senha e perfil são obrigatórios');
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return error(res, 'Email já cadastrado');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed, roleId },
      include: { role: true }
    });

    await auditLog(req.user.id, 'create', 'User', user.id, null, { name, email }, req);
    const { password: _, ...safe } = user;
    return created(res, safe, 'Usuário criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Usuário não encontrado', 404);

    const { password, ...updateData } = req.body;
    if (updateData.email) updateData.email = updateData.email.toLowerCase();
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { role: true }
    });

    await auditLog(req.user.id, 'update', 'User', user.id, existing, updateData, req);
    const { password: _, ...safe } = user;
    return success(res, safe, 'Usuário atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return error(res, 'Não é possível desativar o próprio usuário');
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false }
    });
    await auditLog(req.user.id, 'delete', 'User', user.id, null, null, req);
    return success(res, null, 'Usuário desativado com sucesso');
  } catch (err) { next(err); }
};

exports.auditHistory = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { entityId: req.params.id, entity: 'User' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return success(res, logs);
  } catch (err) { next(err); }
};
