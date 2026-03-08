const success = (res, data, message = 'Operação realizada com sucesso', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data, message = 'Registro criado com sucesso') => {
  return res.status(201).json({ success: true, message, data });
};

const paginated = (res, data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return res.json({
    success: true,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

const error = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, error: message });
};

module.exports = { success, created, paginated, error };
