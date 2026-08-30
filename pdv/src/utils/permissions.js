/**
 * Verifica se o usuário tem acesso ao ERP completo.
 * Critério: role admin  OU  possui permissão em pelo menos um módulo além de "sales".
 */
export function hasErpAccess(user) {
  if (!user) return false
  if (user.role?.name === 'admin') return true

  try {
    const perms = JSON.parse(user.role?.permissions || '{}')
    const erpModules = [
      'users', 'financial', 'reports', 'products', 'inventory',
      'purchases', 'employees', 'suppliers', 'customers',
      'services', 'service-orders', 'admin'
    ]
    return erpModules.some(mod => Array.isArray(perms[mod]) && perms[mod].length > 0)
  } catch {
    return false
  }
}

/** Verifica uma permissão específica: hasPermission(user, 'sales', 'write') */
export function hasPermission(user, module, action = 'read') {
  if (!user) return false
  if (user.role?.name === 'admin') return true
  try {
    const perms = JSON.parse(user.role?.permissions || '{}')
    return Array.isArray(perms[module]) && perms[module].includes(action)
  } catch {
    return false
  }
}
