const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');
const { sendExcel, sendCsv } = require('../../utils/export');

const generateNumber = async () => {
  const last = await prisma.salesOrder.findFirst({ orderBy: { number: 'desc' }, where: { number: { startsWith: 'VND' } } });
  const num = last ? parseInt(last.number.replace('VND', '')) + 1 : 1;
  return `VND${String(num).padStart(6, '0')}`;
};

const calcTotals = (items) => {
  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const discount = items.reduce((s, i) => s + (i.discount || 0), 0);
  const total = subtotal - discount;
  return { subtotal, discount, total };
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, status, customerId, startDate, endDate } = req.query;
    const where = {};
    if (search) where.OR = [{ number: { contains: search } }, { customer: { name: { contains: search } } }];
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, code: true } }, items: { include: { product: { select: { name: true, code: true } } } } }
      }),
      prisma.salesOrder.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } },
        receivables: true
      }
    });
    if (!data) return error(res, 'Pedido não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { customerId, items, paymentTerms, notes, dueDate } = req.body;
    if (!customerId) return error(res, 'Cliente é obrigatório');
    if (!items || !items.length) return error(res, 'Itens são obrigatórios');

    const number = await generateNumber();
    const itemsWithTotal = items.map(i => ({
      ...i,
      total: (i.quantity * i.unitPrice) - (i.discount || 0)
    }));
    const { subtotal, discount, total } = calcTotals(itemsWithTotal);

    const data = await prisma.salesOrder.create({
      data: {
        number, customerId, subtotal, discount, total, paymentTerms, notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: { create: itemsWithTotal }
      },
      include: { customer: true, items: { include: { product: true } } }
    });

    await auditLog(req.user.id, 'create', 'SalesOrder', data.id, null, { number, customerId, total }, req);
    return created(res, data, 'Pedido de venda criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Pedido não encontrado', 404);
    if (existing.status === 'invoiced') return error(res, 'Pedido faturado não pode ser editado');
    if (existing.status === 'cancelled') return error(res, 'Pedido cancelado não pode ser editado');

    const { items, ...orderData } = req.body;
    let updateData = { ...orderData };

    if (items) {
      const itemsWithTotal = items.map(i => ({ ...i, total: (i.quantity * i.unitPrice) - (i.discount || 0) }));
      const { subtotal, discount, total } = calcTotals(itemsWithTotal);
      updateData = { ...updateData, subtotal, discount, total };
      await prisma.salesOrderItem.deleteMany({ where: { orderId: req.params.id } });
      await prisma.salesOrderItem.createMany({ data: itemsWithTotal.map(i => ({ ...i, orderId: req.params.id })) });
    }

    const data = await prisma.salesOrder.update({
      where: { id: req.params.id }, data: updateData,
      include: { customer: true, items: { include: { product: true } } }
    });
    await auditLog(req.user.id, 'update', 'SalesOrder', data.id, existing, updateData, req);
    return success(res, data, 'Pedido atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatus = ['draft', 'confirmed', 'invoiced', 'cancelled'];
    if (!validStatus.includes(status)) return error(res, 'Status inválido');

    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Pedido não encontrado', 404);

    const updateData = { status };
    if (status === 'invoiced') updateData.invoicedAt = new Date();

    const data = await prisma.salesOrder.update({ where: { id: req.params.id }, data: updateData });

    // When invoiced, generate receivable
    if (status === 'invoiced' && existing.status !== 'invoiced') {
      await prisma.accountReceivable.create({
        data: {
          customerId: data.customerId,
          orderId: data.id,
          description: `Venda ${data.number}`,
          amount: data.total,
          dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      // Move stock out
      const items = await prisma.salesOrderItem.findMany({ where: { orderId: data.id } });
      for (const item of items) {
        const inv = await prisma.inventory.findUnique({ where: { productId: item.productId } });
        if (inv) {
          const newQty = inv.quantity - item.quantity;
          await prisma.inventory.update({ where: { productId: item.productId }, data: { quantity: newQty } });
          await prisma.inventoryMovement.create({
            data: {
              productId: item.productId, type: 'out', quantity: item.quantity,
              balance: newQty, reason: 'Venda', reference: data.number
            }
          });
        }
      }
    }

    await auditLog(req.user.id, 'update', 'SalesOrder', data.id, { status: existing.status }, { status }, req);
    return success(res, data, `Status atualizado para ${status}`);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Pedido não encontrado', 404);
    if (existing.status === 'invoiced') return error(res, 'Pedido faturado não pode ser cancelado');
    const data = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    await auditLog(req.user.id, 'delete', 'SalesOrder', data.id, null, null, req);
    return success(res, null, 'Pedido cancelado com sucesso');
  } catch (err) { next(err); }
};

exports.exportData = async (req, res, next) => {
  try {
    const data = await prisma.salesOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } }
    });
    const rows = data.map(s => ({
      Número: s.number, Cliente: s.customer?.name, Status: s.status,
      Subtotal: s.subtotal, Desconto: s.discount, Total: s.total,
      'Data': new Date(s.createdAt).toLocaleDateString('pt-BR')
    }));
    const format = req.query.format || 'excel';
    if (format === 'csv') return sendCsv(res, rows, 'vendas');
    return sendExcel(res, rows, 'Vendas', 'vendas');
  } catch (err) { next(err); }
};
