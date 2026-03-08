const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

exports.listRoles = async (req, res, next) => {
  try {
    const data = await prisma.role.findMany({ include: { _count: { select: { users: true } } }, orderBy: { name: 'asc' } });
    return success(res, data);
  } catch (err) { next(err); }
};

exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name || !permissions) return error(res, 'Nome e permissões são obrigatórios');
    const data = await prisma.role.create({
      data: { name, description, permissions: JSON.stringify(permissions) }
    });
    return created(res, data, 'Perfil criado com sucesso');
  } catch (err) { next(err); }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { permissions, ...rest } = req.body;
    const updateData = { ...rest };
    if (permissions) updateData.permissions = JSON.stringify(permissions);
    const data = await prisma.role.update({ where: { id: req.params.id }, data: updateData });
    return success(res, data, 'Perfil atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { _count: { select: { users: true } } } });
    if (!role) return error(res, 'Perfil não encontrado', 404);
    if (role._count.users > 0) return error(res, 'Perfil possui usuários vinculados');
    await prisma.role.delete({ where: { id: req.params.id } });
    return success(res, null, 'Perfil excluído com sucesso');
  } catch (err) { next(err); }
};

exports.listAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { userId, entity, action, startDate, endDate } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.systemStats = async (req, res, next) => {
  try {
    const [users, customers, suppliers, products, sales, purchases] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count({ where: { active: true } }),
      prisma.supplier.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true } }),
      prisma.salesOrder.count({ where: { status: { not: 'cancelled' } } }),
      prisma.purchaseOrder.count({ where: { status: { not: 'cancelled' } } })
    ]);
    return success(res, { users, customers, suppliers, products, sales, purchases });
  } catch (err) { next(err); }
};
