const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getOrderBy = (query, allowedFields = ['createdAt'], defaultField = 'createdAt') => {
  const sortField = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { [sortField]: sortOrder };
};

const buildSearchFilter = (search, fields) => {
  if (!search) return {};
  return {
    OR: fields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }))
  };
};

module.exports = { getPagination, getOrderBy, buildSearchFilter };
