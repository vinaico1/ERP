const prisma = require('../../config/database');
const { success, created, paginated, error } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/audit');

const generateNumber = async () => {
  const last = await prisma.serviceOrder.findFirst({ orderBy: { number: 'desc' }, where: { number: { startsWith: 'OS' } } });
  const num = last ? parseInt(last.number.replace('OS', '')) + 1 : 1;
  return `OS${String(num).padStart(6, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, status, employeeId, customerId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (customerId) where.customerId = customerId;
    if (search) where.OR = [
      { number: { contains: search } },
      { service: { name: { contains: search } } }
    ];

    const [data, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { name: true, code: true } },
          customer: { select: { name: true } },
          employee: { select: { name: true } }
        }
      }),
      prisma.serviceOrder.count({ where })
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await prisma.serviceOrder.findUnique({
      where: { id: req.params.id },
      include: { service: true, customer: true, employee: true }
    });
    if (!data) return error(res, 'Ordem de serviço não encontrada', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) return error(res, 'Serviço é obrigatório');
    const number = await generateNumber();
    const data = await prisma.serviceOrder.create({
      data: { ...req.body, number, scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null },
      include: { service: true, customer: true, employee: true }
    });
    await auditLog(req.user.id, 'create', 'ServiceOrder', data.id, null, { number }, req);
    return created(res, data, 'Ordem de serviço criada com sucesso');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.serviceOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Ordem de serviço não encontrada', 404);
    const data = await prisma.serviceOrder.update({
      where: { id: req.params.id }, data: req.body,
      include: { service: true, customer: true, employee: true }
    });
    await auditLog(req.user.id, 'update', 'ServiceOrder', data.id, existing, req.body, req);
    return success(res, data, 'Ordem de serviço atualizada com sucesso');
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatus = ['open', 'in_progress', 'done', 'cancelled'];
    if (!validStatus.includes(status)) return error(res, 'Status inválido');

    const updateData = { status };
    if (status === 'in_progress') updateData.startedAt = new Date();
    if (status === 'done') updateData.completedAt = new Date();

    const data = await prisma.serviceOrder.update({ where: { id: req.params.id }, data: updateData });
    await auditLog(req.user.id, 'update', 'ServiceOrder', data.id, null, { status }, req);
    return success(res, data, `Status atualizado para ${status}`);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const data = await prisma.serviceOrder.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    await auditLog(req.user.id, 'delete', 'ServiceOrder', data.id, null, null, req);
    return success(res, null, 'Ordem de serviço cancelada');
  } catch (err) { next(err); }
};
