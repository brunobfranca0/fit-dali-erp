export const APP_ROLES = ['admin', 'gestor', 'atendimento', 'producao'] as const

export type AppRole = (typeof APP_ROLES)[number]

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  atendimento: 'Atendimento',
  producao: 'Produção',
}

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acesso completo e gerenciamento de acessos.',
  gestor: 'Acesso a todos os módulos operacionais.',
  atendimento: 'Pedidos, clientes e visão geral.',
  producao: 'Fila de produção e atualização de status.',
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && APP_ROLES.some(role => role === value)
}

export function getRoleHome(role: AppRole): string {
  return role === 'producao' ? '/dashboard/production' : '/dashboard'
}

export function canAccessPath(role: AppRole, pathname: string): boolean {
  if (role === 'admin') return pathname.startsWith('/dashboard')
  if (role === 'gestor') return pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/users') && !pathname.startsWith('/dashboard/integrations') && !pathname.startsWith('/dashboard/api')
  if (role === 'atendimento') {
    return pathname === '/dashboard'
      || ['/dashboard/orders', '/dashboard/customers', '/dashboard/crm'].some(path => pathname === path || pathname.startsWith(`${path}/`))
  }
  return pathname === '/dashboard/production' || pathname.startsWith('/dashboard/production/')
}
