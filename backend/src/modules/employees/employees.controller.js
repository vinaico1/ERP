const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');

const generateCode = async () => {
  const last = await prisma.employee.findFirst({ orderBy: { code: 'desc' }, where: { code: { startsWith: 'FUN' } } });
  const num = last ? parseInt(last.code.replace('FUN', '')) + 1 : 1;
  return `FUN${String(num).padStart(5, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, active, department } = req.query;
    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }, { position: { contains: search } }];
    if (active !== undefined) where.active = active === 'true';
    if (department) where.department = { contains: department };

    const [data, total] = await Promise.all([
      prisma.employee.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.employee.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!data) return error(res, 'Funcionário não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.body.name) return error(res, 'Nome é obrigatório');
    const code = req.body.code || await generateCode();
    const data = await prisma.employee.create({ data: { ...req.body, code } });
    await auditLog(req.user.id, 'create', 'Employee', data.id, null, req.body, req);
    return created(res, data, 'Funcionário criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Funcionário não encontrado', 404);
    const data = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
    await auditLog(req.user.id, 'update', 'Employee', data.id, existing, req.body, req);
    return success(res, data, 'Funcionário atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const data = await prisma.employee.update({ where: { id: req.params.id }, data: { active: false } });
    await auditLog(req.user.id, 'delete', 'Employee', data.id, null, null, req);
    return success(res, null, 'Funcionário desativado com sucesso');
  } catch (err) { next(err); }
};
