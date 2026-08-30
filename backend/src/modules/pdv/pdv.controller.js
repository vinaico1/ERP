const prisma = require('../../config/database');

/**
 * Retorna todos os produtos ativos com estoque em tempo real.
 * Sem limitação de paginação — ideal para o PDV carregar o catálogo completo.
 * GET /api/pdv/products?search=&categoryId=
 */
exports.products = async (req, res, next) => {
  try {
    const { search, categoryId } = req.query;

    const where = { active: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        price: true,
        unit: true,
        ncm: true,
        minStock: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        inventory: { select: { quantity: true, location: true } }
      }
    });

    return res.json({ data: products, total: products.length });
  } catch (err) {
    next(err);
  }
};

/**
 * Retorna todas as categorias de produtos.
 * GET /api/pdv/categories
 */
exports.categories = async (req, res, next) => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ data: categories });
  } catch (err) {
    next(err);
  }
};

/**
 * Retorna o estoque atual de um produto.
 * GET /api/pdv/stock/:productId
 */
exports.stock = async (req, res, next) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: req.params.productId },
      select: { quantity: true, location: true, updatedAt: true }
    });
    return res.json({ data: inventory || { quantity: 0 } });
  } catch (err) {
    next(err);
  }
};

/**
 * Retorna o resumo do caixa do dia (todas as vendas PDV por forma de pagamento).
 * GET /api/pdv/caixa?date=YYYY-MM-DD
 */
exports.caixa = async (req, res, next) => {
  try {
    const dateParam = req.query.date;
    let start, end;
    if (dateParam) {
      const [y, m, d] = dateParam.split('-').map(Number);
      start = new Date(y, m - 1, d, 0, 0, 0, 0);
      end   = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      start = new Date(); start.setHours(0, 0, 0, 0);
      end   = new Date(); end.setHours(23, 59, 59, 999);
    }

    const sales = await prisma.salesOrder.findMany({
      where: {
        origin: 'pdv',
        status: 'invoiced',
        createdAt: { gte: start, lte: end }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        number: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        customer: { select: { name: true } }
      }
    });

    const METHODS = [
      { id: 'cash',        label: 'Dinheiro',        icon: '💵' },
      { id: 'credit_card', label: 'Cartão Crédito',  icon: '💳' },
      { id: 'debit_card',  label: 'Cartão Débito',   icon: '💳' },
      { id: 'pix',         label: 'PIX',             icon: '⚡' },
      { id: 'mixed',       label: 'Misto',           icon: '🔀' },
    ];

    const totals = METHODS.map(m => ({
      ...m,
      count: sales.filter(s => s.paymentMethod === m.id).length,
      total: sales.filter(s => s.paymentMethod === m.id).reduce((acc, s) => acc + s.total, 0)
    }));

    const grandTotal = sales.reduce((acc, s) => acc + s.total, 0);

    return res.json({
      data: {
        date: start.toISOString().split('T')[0],
        sales,
        totals,
        count: sales.length,
        grandTotal
      }
    });
  } catch (err) {
    next(err);
  }
};
