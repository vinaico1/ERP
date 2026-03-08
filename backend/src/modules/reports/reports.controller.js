const prisma = require('../../config/database');
const { success, error } = require('../../utils/response');

exports.dashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalCustomers, totalSuppliers, totalProducts,
      salesThisMonth, purchasesThisMonth,
      pendingPayables, pendingReceivables,
      cashFlowMonth, lowStockCount, openServiceOrders
    ] = await Promise.all([
      prisma.customer.count({ where: { active: true } }),
      prisma.supplier.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true } }),
      prisma.salesOrder.aggregate({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth }, status: { not: 'cancelled' } },
        _sum: { total: true }, _count: true
      }),
      prisma.purchaseOrder.aggregate({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth }, status: { not: 'cancelled' } },
        _sum: { total: true }, _count: true
      }),
      prisma.accountPayable.aggregate({
        where: { status: { in: ['pending', 'overdue'] } },
        _sum: { amount: true }, _count: true
      }),
      prisma.accountReceivable.aggregate({
        where: { status: { in: ['pending', 'overdue'] } },
        _sum: { amount: true }, _count: true
      }),
      prisma.cashFlow.groupBy({
        by: ['type'],
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true }
      }),
      prisma.product.count({ where: { active: true, minStock: { gt: 0 } } }),
      prisma.serviceOrder.count({ where: { status: { in: ['open', 'in_progress'] } } })
    ]);

    // Low stock count
    const allProducts = await prisma.product.findMany({
      where: { active: true, minStock: { gt: 0 } },
      include: { inventory: true }
    });
    const actualLowStock = allProducts.filter(p => p.inventory && p.inventory.quantity <= p.minStock).length;

    const cfIncome = cashFlowMonth.find(c => c.type === 'income')?._sum?.amount || 0;
    const cfExpense = cashFlowMonth.find(c => c.type === 'expense')?._sum?.amount || 0;

    return success(res, {
      masterData: {
        customers: totalCustomers,
        suppliers: totalSuppliers,
        products: totalProducts
      },
      salesMonth: {
        total: salesThisMonth._sum.total || 0,
        count: salesThisMonth._count
      },
      purchasesMonth: {
        total: purchasesThisMonth._sum.total || 0,
        count: purchasesThisMonth._count
      },
      financial: {
        pendingPayables: pendingPayables._sum.amount || 0,
        pendingPayablesCount: pendingPayables._count,
        pendingReceivables: pendingReceivables._sum.amount || 0,
        pendingReceivablesCount: pendingReceivables._count,
        cashFlowBalance: cfIncome - cfExpense,
        monthIncome: cfIncome,
        monthExpense: cfExpense
      },
      alerts: {
        lowStockCount: actualLowStock,
        openServiceOrders
      }
    });
  } catch (err) { next(err); }
};

exports.salesByPeriod = async (req, res, next) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const sales = await prisma.salesOrder.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'cancelled' }
      },
      select: { total: true, createdAt: true, status: true }
    });

    // Group by month
    const byMonth = {};
    for (let m = 0; m < 12; m++) {
      const key = `${year}-${String(m + 1).padStart(2, '0')}`;
      byMonth[key] = { month: key, total: 0, count: 0 };
    }
    sales.forEach(s => {
      const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (byMonth[key]) {
        byMonth[key].total += s.total;
        byMonth[key].count++;
      }
    });

    return success(res, Object.values(byMonth));
  } catch (err) { next(err); }
};

exports.salesByCustomer = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const where = { status: { not: 'cancelled' } };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const sales = await prisma.salesOrder.findMany({
      where, include: { customer: { select: { name: true, code: true } } }
    });

    const byCustomer = {};
    sales.forEach(s => {
      if (!byCustomer[s.customerId]) {
        byCustomer[s.customerId] = { customerId: s.customerId, customer: s.customer.name, total: 0, count: 0 };
      }
      byCustomer[s.customerId].total += s.total;
      byCustomer[s.customerId].count++;
    });

    const result = Object.values(byCustomer).sort((a, b) => b.total - a.total).slice(0, Number(limit));
    return success(res, result);
  } catch (err) { next(err); }
};

exports.inventorySummary = async (req, res, next) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: { include: { category: true } } }
    });
    const totalValue = inventory.reduce((s, i) => s + (i.quantity * i.product.cost), 0);
    const totalItems = inventory.length;
    const lowStock = inventory.filter(i => i.quantity <= i.product.minStock && i.product.minStock > 0).length;
    const zeroStock = inventory.filter(i => i.quantity === 0).length;

    return success(res, { totalValue, totalItems, lowStock, zeroStock, items: inventory });
  } catch (err) { next(err); }
};

exports.financialSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59');

    const [payablesPaid, receivablesReceived, totalPayablesPending, totalReceivablesPending] = await Promise.all([
      prisma.accountPayable.aggregate({
        where: { status: 'paid', ...(Object.keys(dateFilter).length && { paidDate: dateFilter }) },
        _sum: { paidAmount: true }
      }),
      prisma.accountReceivable.aggregate({
        where: { status: 'received', ...(Object.keys(dateFilter).length && { receivedDate: dateFilter }) },
        _sum: { receivedAmount: true }
      }),
      prisma.accountPayable.aggregate({
        where: { status: { in: ['pending', 'overdue'] } },
        _sum: { amount: true }
      }),
      prisma.accountReceivable.aggregate({
        where: { status: { in: ['pending', 'overdue'] } },
        _sum: { amount: true }
      })
    ]);

    return success(res, {
      paid: payablesPaid._sum.paidAmount || 0,
      received: receivablesReceived._sum.receivedAmount || 0,
      pendingPayables: totalPayablesPending._sum.amount || 0,
      pendingReceivables: totalReceivablesPending._sum.amount || 0,
      netBalance: (receivablesReceived._sum.receivedAmount || 0) - (payablesPaid._sum.paidAmount || 0)
    });
  } catch (err) { next(err); }
};

exports.topProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const items = await prisma.salesOrderItem.findMany({
      include: { product: { select: { name: true, code: true } } }
    });
    const byProduct = {};
    items.forEach(i => {
      if (!byProduct[i.productId]) {
        byProduct[i.productId] = { productId: i.productId, name: i.product.name, code: i.product.code, quantity: 0, total: 0 };
      }
      byProduct[i.productId].quantity += i.quantity;
      byProduct[i.productId].total += i.total;
    });
    const result = Object.values(byProduct).sort((a, b) => b.total - a.total).slice(0, Number(limit));
    return success(res, result);
  } catch (err) { next(err); }
};

exports.overdueAccounts = async (req, res, next) => {
  try {
    const [payables, receivables] = await Promise.all([
      prisma.accountPayable.findMany({
        where: { status: 'overdue' },
        include: { supplier: { select: { name: true } } },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.accountReceivable.findMany({
        where: { status: 'overdue' },
        include: { customer: { select: { name: true } } },
        orderBy: { dueDate: 'asc' }
      })
    ]);
    return success(res, { payables, receivables });
  } catch (err) { next(err); }
};
