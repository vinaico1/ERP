const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search } = req.query;
    const where = { product: { active: true } };
    if (search) where.product = { ...where.product, OR: [{ name: { contains: search } }, { code: { contains: search } }] };

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({ where, skip, take: limit, include: { product: { include: { category: true } } } }),
      prisma.inventory.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getByProduct = async (req, res, next) => {
  try {
    const data = await prisma.inventory.findUnique({
      where: { productId: req.params.productId },
      include: { product: true }
    });
    if (!data) return error(res, 'Estoque não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.movements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { productId, type, startDate, endDate } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, code: true, unit: true } } }
      }),
      prisma.inventoryMovement.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.lowStock = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true, minStock: { gt: 0 } },
      include: { inventory: true, category: true }
    });
    const lowStock = products.filter(p => p.inventory && p.inventory.quantity <= p.minStock);
    return success(res, lowStock);
  } catch (err) { next(err); }
};

exports.adjustment = async (req, res, next) => {
  try {
    const { productId, quantity, reason, notes } = req.body;
    if (!productId || quantity === undefined) return error(res, 'Produto e quantidade são obrigatórios');

    const inv = await prisma.inventory.findUnique({ where: { productId } });
    if (!inv) return error(res, 'Estoque não encontrado para este produto', 404);

    const oldQty = inv.quantity;
    const diff = quantity - oldQty;

    await prisma.inventory.update({ where: { productId }, data: { quantity } });
    await prisma.inventoryMovement.create({
      data: {
        productId, type: 'adjustment', quantity: Math.abs(diff),
        balance: quantity, reason: reason || 'Ajuste de inventário', notes
      }
    });

    await auditLog(req.user.id, 'update', 'Inventory', productId, { quantity: oldQty }, { quantity }, req);
    return success(res, { productId, oldQuantity: oldQty, newQuantity: quantity, diff }, 'Ajuste realizado com sucesso');
  } catch (err) { next(err); }
};

exports.registerMovement = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, reference, notes } = req.body;
    if (!productId || !type || !quantity) return error(res, 'Produto, tipo e quantidade são obrigatórios');
    if (!['in', 'out', 'adjustment', 'return'].includes(type)) return error(res, 'Tipo inválido');

    const inv = await prisma.inventory.findUnique({ where: { productId } });
    if (!inv) return error(res, 'Estoque não encontrado', 404);

    const newQty = type === 'in' || type === 'return'
      ? inv.quantity + quantity
      : inv.quantity - quantity;

    if (newQty < 0) return error(res, 'Estoque insuficiente para esta operação');

    await prisma.inventory.update({ where: { productId }, data: { quantity: newQty } });
    const movement = await prisma.inventoryMovement.create({
      data: { productId, type, quantity, balance: newQty, reason, reference, notes }
    });

    await auditLog(req.user.id, 'create', 'InventoryMovement', movement.id, null, { productId, type, quantity }, req);
    return created(res, { ...movement, newBalance: newQty }, 'Movimentação registrada com sucesso');
  } catch (err) { next(err); }
};
