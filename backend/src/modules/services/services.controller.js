const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');

const generateCode = async () => {
  const last = await prisma.service.findFirst({ orderBy: { code: 'desc' }, where: { code: { startsWith: 'SRV' } } });
  const num = last ? parseInt(last.code.replace('SRV', '')) + 1 : 1;
  return `SRV${String(num).padStart(5, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, active } = req.query;
    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
    if (active !== undefined) where.active = active === 'true';
    const [data, total] = await Promise.all([
      prisma.service.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.service.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!data) return error(res, 'Serviço não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.body.name) return error(res, 'Nome é obrigatório');
    const code = req.body.code || await generateCode();
    const data = await prisma.service.create({ data: { ...req.body, code } });
    await auditLog(req.user.id, 'create', 'Service', data.id, null, req.body, req);
    return created(res, data, 'Serviço criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Serviço não encontrado', 404);
    const data = await prisma.service.update({ where: { id: req.params.id }, data: req.body });
    await auditLog(req.user.id, 'update', 'Service', data.id, existing, req.body, req);
    return success(res, data, 'Serviço atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const data = await prisma.service.update({ where: { id: req.params.id }, data: { active: false } });
    await auditLog(req.user.id, 'delete', 'Service', data.id, null, null, req);
    return success(res, null, 'Serviço desativado com sucesso');
  } catch (err) { next(err); }
};
