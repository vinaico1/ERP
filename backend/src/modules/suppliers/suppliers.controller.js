const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');
const { sendExcel, sendCsv } = require('../../utils/export');

const generateCode = async () => {
  const last = await prisma.supplier.findFirst({ orderBy: { code: 'desc' }, where: { code: { startsWith: 'FOR' } } });
  const num = last ? parseInt(last.code.replace('FOR', '')) + 1 : 1;
  return `FOR${String(num).padStart(5, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, active } = req.query;
    const where = {};
    if (search) where.OR = [
      { name: { contains: search } }, { code: { contains: search } },
      { email: { contains: search } }, { document: { contains: search } }
    ];
    if (active !== undefined) where.active = active === 'true';

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.supplier.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.supplier.findUnique({ where: { id: req.params.id } });
    if (!data) return error(res, 'Fornecedor não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.body.name) return error(res, 'Nome é obrigatório');
    const code = req.body.code || await generateCode();
    const data = await prisma.supplier.create({ data: { ...req.body, code } });
    await auditLog(req.user.id, 'create', 'Supplier', data.id, null, req.body, req);
    return created(res, data, 'Fornecedor criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.supplier.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Fornecedor não encontrado', 404);
    const data = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    await auditLog(req.user.id, 'update', 'Supplier', data.id, existing, req.body, req);
    return success(res, data, 'Fornecedor atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const data = await prisma.supplier.update({ where: { id: req.params.id }, data: { active: false } });
    await auditLog(req.user.id, 'delete', 'Supplier', data.id, null, null, req);
    return success(res, null, 'Fornecedor desativado com sucesso');
  } catch (err) { next(err); }
};

exports.exportData = async (req, res, next) => {
  try {
    const data = await prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    const rows = data.map(s => ({
      Código: s.code, Nome: s.name, Email: s.email, Telefone: s.phone,
      Documento: s.document, Cidade: s.city, Estado: s.state
    }));
    const format = req.query.format || 'excel';
    if (format === 'csv') return sendCsv(res, rows, 'fornecedores');
    return sendExcel(res, rows, 'Fornecedores', 'fornecedores');
  } catch (err) { next(err); }
};
