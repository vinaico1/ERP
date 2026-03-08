const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');

const generateNumber = async () => {
  const last = await prisma.purchaseOrder.findFirst({ orderBy: { number: 'desc' }, where: { number: { startsWith: 'CMP' } } });
  const num = last ? parseInt(last.number.replace('CMP', '')) + 1 : 1;
  return `CMP${String(num).padStart(6, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, status, supplierId, startDate, endDate } = req.query;
    const where = {};
    if (search) where.OR = [{ number: { contains: search } }, { supplier: { name: { contains: search } } }];
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { name: true, code: true } }, items: true }
      }),
      prisma.purchaseOrder.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, items: { include: { product: true } }, payables: true }
    });
    if (!data) return error(res, 'Pedido não encontrado', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { supplierId, items, paymentTerms, notes, expectedDate } = req.body;
    if (!supplierId) return error(res, 'Fornecedor é obrigatório');
    if (!items || !items.length) return error(res, 'Itens são obrigatórios');

    const number = await generateNumber();
    const itemsWithTotal = items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
    const total = itemsWithTotal.reduce((s, i) => s + i.total, 0);

    const data = await prisma.purchaseOrder.create({
      data: {
        number, supplierId, total, paymentTerms, notes,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        items: { create: itemsWithTotal }
      },
      include: { supplier: true, items: { include: { product: true } } }
    });

    await auditLog(req.user.id, 'create', 'PurchaseOrder', data.id, null, { number, supplierId, total }, req);
    return created(res, data, 'Pedido de compra criado com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Pedido não encontrado', 404);
    if (['received', 'cancelled'].includes(existing.status)) {
      return error(res, 'Pedido não pode ser editado neste status');
    }
    const { items, ...orderData } = req.body;
    let updateData = { ...orderData };

    if (items) {
      const itemsWithTotal = items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
      updateData.total = itemsWithTotal.reduce((s, i) => s + i.total, 0);
      await prisma.purchaseOrderItem.deleteMany({ where: { orderId: req.params.id } });
      await prisma.purchaseOrderItem.createMany({ data: itemsWithTotal.map(i => ({ ...i, orderId: req.params.id })) });
    }

    const data = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: updateData,
      include: { supplier: true, items: { include: { product: true } } }
    });
    await auditLog(req.user.id, 'update', 'PurchaseOrder', data.id, existing, updateData, req);
    return success(res, data, 'Pedido atualizado com sucesso');
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatus = ['draft', 'sent', 'partial', 'received', 'cancelled'];
    if (!validStatus.includes(status)) return error(res, 'Status inválido');

    const existing = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Pedido não encontrado', 404);

    const updateData = { status };
    if (status === 'received') updateData.receivedAt = new Date();

    const data = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: updateData });

    // Ao receber, gerar conta a pagar e atualizar estoque
    if (status === 'received' && existing.status !== 'received') {
      await prisma.accountPayable.create({
        data: {
          supplierId: data.supplierId, orderId: data.id,
          description: `Compra ${data.number}`, amount: data.total,
          dueDate: data.expectedDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      const orderWithItems = await prisma.purchaseOrder.findUnique({
        where: { id: req.params.id }, include: { items: true }
      });

      for (const item of orderWithItems.items) {
        const restante = item.quantity - item.received;
        if (restante <= 0) continue;

        const inv = await prisma.inventory.findUnique({ where: { productId: item.productId } });
        const novaQtd = (inv?.quantity ?? 0) + restante;

        await prisma.inventory.upsert({
          where: { productId: item.productId },
          update: { quantity: novaQtd },
          create: { productId: item.productId, quantity: restante }
        });

        await prisma.inventoryMovement.create({
          data: {
            productId: item.productId, type: 'in', quantity: restante,
            balance: novaQtd, reason: 'Recebimento de compra', reference: existing.number
          }
        });

        await prisma.purchaseOrderItem.update({
          where: { id: item.id },
          data: { received: item.quantity }
        });
      }
    }

    const statusLabels = { draft: 'Rascunho', sent: 'Enviado', partial: 'Parcial', received: 'Recebido', cancelled: 'Cancelado' };
    await auditLog(req.user.id, 'update', 'PurchaseOrder', data.id, { status: existing.status }, { status }, req);
    return success(res, data, `Status atualizado para ${statusLabels[status] || status}`);
  } catch (err) { next(err); }
};

exports.receiveItems = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ itemId, quantityReceived }]
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id }, include: { items: true }
    });
    if (!order) return error(res, 'Pedido não encontrado', 404);

    for (const received of items) {
      const orderItem = order.items.find(i => i.id === received.itemId);
      if (!orderItem) continue;

      await prisma.purchaseOrderItem.update({
        where: { id: received.itemId },
        data: { received: orderItem.received + received.quantityReceived }
      });

      // Atualizar estoque (cria se produto ainda não possui registro)
      const inv = await prisma.inventory.findUnique({ where: { productId: orderItem.productId } });
      const novaQtd = (inv?.quantity ?? 0) + received.quantityReceived;
      await prisma.inventory.upsert({
        where: { productId: orderItem.productId },
        update: { quantity: novaQtd },
        create: { productId: orderItem.productId, quantity: received.quantityReceived }
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: orderItem.productId, type: 'in', quantity: received.quantityReceived,
          balance: novaQtd, reason: 'Recebimento de compra', reference: order.number
        }
      });
    }

    await auditLog(req.user.id, 'update', 'PurchaseOrder', order.id, null, { action: 'receive_items' }, req);
    return success(res, null, 'Recebimento registrado com sucesso');
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Pedido não encontrado', 404);
    if (existing.status === 'received') return error(res, 'Pedido recebido não pode ser cancelado');
    const data = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    await auditLog(req.user.id, 'delete', 'PurchaseOrder', data.id, null, null, req);
    return success(res, null, 'Pedido cancelado com sucesso');
  } catch (err) { next(err); }
};
