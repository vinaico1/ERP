const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');
const { sendExcel, sendCsv } = require('../../utils/export');

const generateCode = async () => {
  const last = await prisma.product.findFirst({ orderBy: { code: 'desc' }, where: { code: { startsWith: 'PRD' } } });
  const num = last ? parseInt(last.code.replace('PRD', '')) + 1 : 1;
  return `PRD${String(num).padStart(5, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, active, categoryId } = req.query;
    const where = {};
    if (search) where.OR = [
      { name: { contains: search } }, { code: { contains: search } },
      { description: { contains: search } }
    ];
    if (active !== undefined) where.active = active === 'true';
    if (categoryId) where.categoryId = categoryId;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit, orderBy: { name: 'asc' },
        include: { category: true, inventory: true }
      }),
      prisma.product.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, inventory: true }
    });
    if (!data) return error(res, 'Produto não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.body.name) return error(res, 'Nome é obrigatório');
    const code = req.body.code || await generateCode();
    const { categoryId, ...rest } = req.body;
    const data = await prisma.product.create({
      data: { ...rest, code, ...(categoryId && { category: { connect: { id: categoryId } } }) },
      include: { category: true }
    });
    // Create inventory entry
    await prisma.inventory.create({ data: { productId: data.id, quantity: 0 } });
    await auditLog(req.user.id, 'create', 'Product', data.id, null, req.body, req);
    return created(res, data, 'Produto criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Produto não encontrado', 404);
    const data = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true, inventory: true }
    });
    await auditLog(req.user.id, 'update', 'Product', data.id, existing, req.body, req);
    return success(res, data, 'Produto atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const data = await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    await auditLog(req.user.id, 'delete', 'Product', data.id, null, null, req);
    return success(res, null, 'Produto desativado com sucesso');
  } catch (err) { next(err); }
};

exports.lowStock = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true, minStock: { gt: 0 } },
      include: { inventory: true }
    });
    const lowStock = products.filter(p => p.inventory && p.inventory.quantity <= p.minStock);
    return success(res, lowStock);
  } catch (err) { next(err); }
};

exports.listCategories = async (req, res, next) => {
  try {
    const data = await prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
    return success(res, data);
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    if (!req.body.name) return error(res, 'Nome é obrigatório');
    const data = await prisma.productCategory.create({ data: { name: req.body.name } });
    return created(res, data, 'Categoria criada com sucesso');
  } catch (err) { next(err); }
};

exports.exportData = async (req, res, next) => {
  try {
    const data = await prisma.product.findMany({
      where: { active: true }, orderBy: { name: 'asc' },
      include: { category: true, inventory: true }
    });
    const rows = data.map(p => ({
      Código: p.code, Nome: p.name, Categoria: p.category?.name || '',
      Unidade: p.unit, 'Preço Venda': p.price, 'Custo': p.cost,
      'Estoque Atual': p.inventory?.quantity || 0, 'Estoque Mínimo': p.minStock
    }));
    const format = req.query.format || 'excel';
    if (format === 'csv') return sendCsv(res, rows, 'produtos');
    return sendExcel(res, rows, 'Produtos', 'produtos');
  } catch (err) { next(err); }
};
