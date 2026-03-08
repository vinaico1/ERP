const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');

// ---- Categories ----
exports.listCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = { active: true };
    if (type) where.type = type;
    const data = await prisma.financialCategory.findMany({ where, orderBy: { name: 'asc' } });
    return success(res, data);
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return error(res, 'Nome e tipo são obrigatórios');
    const data = await prisma.financialCategory.create({ data: { name, type } });
    return created(res, data, 'Categoria criada com sucesso');
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const data = await prisma.financialCategory.update({ where: { id: req.params.id }, data: req.body });
    return success(res, data, 'Categoria atualizada com sucesso');
  } catch (err) { next(err); }
};

// ---- Cost Centers ----
exports.listCostCenters = async (req, res, next) => {
  try {
    const data = await prisma.costCenter.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return success(res, data);
  } catch (err) { next(err); }
};

exports.createCostCenter = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return error(res, 'Nome e código são obrigatórios');
    const data = await prisma.costCenter.create({ data: { name, code } });
    return created(res, data, 'Centro de custo criado com sucesso');
  } catch (err) { next(err); }
};

exports.updateCostCenter = async (req, res, next) => {
  try {
    const data = await prisma.costCenter.update({ where: { id: req.params.id }, data: req.body });
    return success(res, data, 'Centro de custo atualizado com sucesso');
  } catch (err) { next(err); }
};

// ---- Payables ----
exports.listPayables = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, supplierId, startDate, endDate, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (search) where.description = { contains: search };
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate + 'T23:59:59');
    }
    // Auto-update overdue
    await prisma.accountPayable.updateMany({
      where: { status: 'pending', dueDate: { lt: new Date() } },
      data: { status: 'overdue' }
    });

    const [data, total] = await Promise.all([
      prisma.accountPayable.findMany({
        where, skip, take: limit, orderBy: { dueDate: 'asc' },
        include: {
          supplier: { select: { name: true } },
          category: { select: { name: true } },
          costCenter: { select: { name: true } }
        }
      }),
      prisma.accountPayable.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getPayable = async (req, res, next) => {
  try {
    const data = await prisma.accountPayable.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, category: true, costCenter: true, order: true }
    });
    if (!data) return error(res, 'Conta a pagar não encontrada', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.createPayable = async (req, res, next) => {
  try {
    const { description, amount, dueDate } = req.body;
    if (!description || !amount || !dueDate) return error(res, 'Descrição, valor e vencimento são obrigatórios');
    const data = await prisma.accountPayable.create({ data: { ...req.body, dueDate: new Date(dueDate) } });
    await auditLog(req.user.id, 'create', 'AccountPayable', data.id, null, req.body, req);
    return created(res, data, 'Conta a pagar criada com sucesso');
  } catch (err) { next(err); }
};

exports.updatePayable = async (req, res, next) => {
  try {
    const existing = await prisma.accountPayable.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Conta não encontrada', 404);
    if (existing.status === 'paid') return error(res, 'Conta paga não pode ser editada');
    const data = await prisma.accountPayable.update({ where: { id: req.params.id }, data: req.body });
    await auditLog(req.user.id, 'update', 'AccountPayable', data.id, existing, req.body, req);
    return success(res, data, 'Conta atualizada com sucesso');
  } catch (err) { next(err); }
};

exports.payPayable = async (req, res, next) => {
  try {
    const { paidAmount, paidDate } = req.body;
    const existing = await prisma.accountPayable.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Conta não encontrada', 404);
    if (existing.status === 'paid') return error(res, 'Conta já está paga');

    const data = await prisma.accountPayable.update({
      where: { id: req.params.id },
      data: { status: 'paid', paidAmount: paidAmount || existing.amount, paidDate: paidDate ? new Date(paidDate) : new Date() }
    });

    // Register in cashflow
    await prisma.cashFlow.create({
      data: {
        type: 'expense', description: existing.description,
        amount: paidAmount || existing.amount,
        date: paidDate ? new Date(paidDate) : new Date(),
        categoryId: existing.categoryId, costCenterId: existing.costCenterId,
        reference: existing.id, notes: `Pagamento de conta a pagar`
      }
    });

    await auditLog(req.user.id, 'update', 'AccountPayable', data.id, { status: 'pending' }, { status: 'paid' }, req);
    return success(res, data, 'Pagamento registrado com sucesso');
  } catch (err) { next(err); }
};

// ---- Receivables ----
exports.listReceivables = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, customerId, startDate, endDate, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) where.description = { contains: search };
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate + 'T23:59:59');
    }
    await prisma.accountReceivable.updateMany({
      where: { status: 'pending', dueDate: { lt: new Date() } },
      data: { status: 'overdue' }
    });

    const [data, total] = await Promise.all([
      prisma.accountReceivable.findMany({
        where, skip, take: limit, orderBy: { dueDate: 'asc' },
        include: {
          customer: { select: { name: true } },
          category: { select: { name: true } },
          costCenter: { select: { name: true } }
        }
      }),
      prisma.accountReceivable.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getReceivable = async (req, res, next) => {
  try {
    const data = await prisma.accountReceivable.findUnique({
      where: { id: req.params.id },
      include: { customer: true, category: true, costCenter: true, order: true }
    });
    if (!data) return error(res, 'Conta a receber não encontrada', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.createReceivable = async (req, res, next) => {
  try {
    const { description, amount, dueDate } = req.body;
    if (!description || !amount || !dueDate) return error(res, 'Descrição, valor e vencimento são obrigatórios');
    const data = await prisma.accountReceivable.create({ data: { ...req.body, dueDate: new Date(dueDate) } });
    await auditLog(req.user.id, 'create', 'AccountReceivable', data.id, null, req.body, req);
    return created(res, data, 'Conta a receber criada com sucesso');
  } catch (err) { next(err); }
};

exports.updateReceivable = async (req, res, next) => {
  try {
    const existing = await prisma.accountReceivable.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Conta não encontrada', 404);
    if (existing.status === 'received') return error(res, 'Conta recebida não pode ser editada');
    const data = await prisma.accountReceivable.update({ where: { id: req.params.id }, data: req.body });
    await auditLog(req.user.id, 'update', 'AccountReceivable', data.id, existing, req.body, req);
    return success(res, data, 'Conta atualizada com sucesso');
  } catch (err) { next(err); }
};

exports.receiveReceivable = async (req, res, next) => {
  try {
    const { receivedAmount, receivedDate } = req.body;
    const existing = await prisma.accountReceivable.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Conta não encontrada', 404);
    if (existing.status === 'received') return error(res, 'Conta já foi recebida');

    const data = await prisma.accountReceivable.update({
      where: { id: req.params.id },
      data: {
        status: 'received',
        receivedAmount: receivedAmount || existing.amount,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date()
      }
    });

    await prisma.cashFlow.create({
      data: {
        type: 'income', description: existing.description,
        amount: receivedAmount || existing.amount,
        date: receivedDate ? new Date(receivedDate) : new Date(),
        categoryId: existing.categoryId, costCenterId: existing.costCenterId,
        reference: existing.id, notes: 'Recebimento de conta a receber'
      }
    });

    await auditLog(req.user.id, 'update', 'AccountReceivable', data.id, { status: 'pending' }, { status: 'received' }, req);
    return success(res, data, 'Recebimento registrado com sucesso');
  } catch (err) { next(err); }
};

// ---- Cash Flow ----
exports.listCashFlow = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { type, startDate, endDate } = req.query;
    const where = {};
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      prisma.cashFlow.findMany({
        where, skip, take: limit, orderBy: { date: 'desc' },
        include: { category: { select: { name: true } }, costCenter: { select: { name: true } } }
      }),
      prisma.cashFlow.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.createCashFlow = async (req, res, next) => {
  try {
    const { type, description, amount, date } = req.body;
    if (!type || !description || !amount || !date) return error(res, 'Tipo, descrição, valor e data são obrigatórios');
    const data = await prisma.cashFlow.create({ data: { ...req.body, date: new Date(date) } });
    await auditLog(req.user.id, 'create', 'CashFlow', data.id, null, req.body, req);
    return created(res, data, 'Lançamento criado com sucesso');
  } catch (err) { next(err); }
};

exports.cashFlowSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
    }

    const [incomes, expenses] = await Promise.all([
      prisma.cashFlow.aggregate({ where: { ...where, type: 'income' }, _sum: { amount: true }, _count: true }),
      prisma.cashFlow.aggregate({ where: { ...where, type: 'expense' }, _sum: { amount: true }, _count: true })
    ]);

    const totalIncome = incomes._sum.amount || 0;
    const totalExpense = expenses._sum.amount || 0;

    return success(res, {
      totalIncome, totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount: incomes._count,
      expenseCount: expenses._count
    });
  } catch (err) { next(err); }
};
