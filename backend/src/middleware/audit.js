const prisma = require('../config/database');

const auditLog = async (userId, action, entity, entityId, oldData, newData, req) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        ip: req?.ip || req?.headers?.['x-forwarded-for'] || null,
        userAgent: req?.headers?.['user-agent'] || null
      }
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error.message);
  }
};

module.exports = { auditLog };
