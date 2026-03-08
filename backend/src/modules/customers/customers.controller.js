const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');
const { sendExcel, sendCsv } = require('../../utils/export');

const generateCode = async () => {
  const last = await prisma.customer.findFirst({ orderBy: { code: 'desc' }, where: { code: { startsWith: 'CLI' } } });
  const num = last ? parseInt(last.code.replace('CLI', '')) + 1 : 1;
  return `CLI${String(num).padStart(5, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, active, type } = req.query;
    const where = {};
    if (search) where.OR = [
      { name: { contains: search } }, { code: { contains: search } },
      { email: { contains: search } }, { document: { contains: search } }
    ];
    if (active !== undefined) where.active = active === 'true';
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.customer.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!data) return error(res, 'Cliente não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'Nome é obrigatório');
    const code = req.body.code || await generateCode();
    const data = await prisma.customer.create({ data: { ...req.body, code } });
    await auditLog(req.user.id, 'create', 'Customer', data.id, null, req.body, req);
    return created(res, data, 'Cliente criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Cliente não encontrado', 404);
    const data = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
    await auditLog(req.user.id, 'update', 'Customer', data.id, existing, req.body, req);
    return success(res, data, 'Cliente atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const data = await prisma.customer.update({ where: { id: req.params.id }, data: { active: false } });
    await auditLog(req.user.id, 'delete', 'Customer', data.id, null, null, req);
    return success(res, null, 'Cliente desativado com sucesso');
  } catch (err) { next(err); }
};

exports.getSales = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({ where: { customerId: req.params.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.salesOrder.count({ where: { customerId: req.params.id } })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getReceivables = async (req, res, next) => {
  try {
    const data = await prisma.accountReceivable.findMany({
      where: { customerId: req.params.id },
      orderBy: { dueDate: 'asc' }
    });
    return success(res, data);
  } catch (err) { next(err); }
};

exports.exportData = async (req, res, next) => {
  try {
    const data = await prisma.customer.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    const rows = data.map(c => ({
      Código: c.code, Nome: c.name, Tipo: c.type, Email: c.email, Telefone: c.phone,
      Documento: c.document, Cidade: c.city, Estado: c.state, Ativo: c.active ? 'Sim' : 'Não'
    }));
    const format = req.query.format || 'excel';
    if (format === 'csv') return sendCsv(res, rows, 'clientes');
    return sendExcel(res, rows, 'Clientes', 'clientes');
  } catch (err) { next(err); }
};
