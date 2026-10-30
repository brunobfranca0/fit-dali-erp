import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_ROLES, isAppRole } from '@/lib/auth/roles'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { response: NextResponse.json({ error: 'Entre novamente para continuar.' }, { status: 401 }) }
  }

  if (user.app_metadata?.role !== 'admin') {
    return { response: NextResponse.json({ error: 'Apenas administradores podem gerenciar acessos.' }, { status: 403 }) }
  }

  return { user }
}

async function listAllUsers(adminClient: ReturnType<typeof createAdminClient>) {
  const users: Array<{
    id: string
    email?: string
    created_at: string
    email_confirmed_at?: string
    banned_until?: string
    app_metadata?: Record<string, unknown>
  }> = []
  let page = 1
  const perPage = 100

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < perPage) break
    page += 1
  }

  return users
}

function toSafeUser(user: Awaited<ReturnType<typeof listAllUsers>>[number]) {
  return {
    id: user.id,
    email: user.email ?? '',
    createdAt: user.created_at,
    emailConfirmed: Boolean(user.email_confirmed_at),
    bannedUntil: user.banned_until ?? null,
    role: isAppRole(user.app_metadata?.role) ? user.app_metadata.role : null,
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if ('response' in auth) return auth.response

  try {
    const adminClient = createAdminClient()
    const users = await listAllUsers(adminClient)
    return NextResponse.json({ users: users.map(toSafeUser) })
  } catch (error) {
    console.error('Falha ao listar acessos:', error)
    return NextResponse.json({ error: 'Não foi possível carregar os acessos. Verifique a chave administrativa do servidor.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('response' in auth) return auth.response

  let body: { email?: unknown; role?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
  }
  if (!isAppRole(body.role) || !APP_ROLES.includes(body.role)) {
    return NextResponse.json({ error: 'Selecione um perfil válido.' }, { status: 400 })
  }

  try {
    const adminClient = createAdminClient()
    const redirectTo = new URL('/auth/accept-invite', request.url).toString()
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const invitedUser = data.user
    const { error: roleError } = await adminClient.auth.admin.updateUserById(invitedUser.id, {
      app_metadata: { ...invitedUser.app_metadata, role: body.role },
    })

    if (roleError) {
      await adminClient.auth.admin.deleteUser(invitedUser.id)
      console.error('Falha ao aplicar perfil ao convite:', roleError)
      return NextResponse.json({ error: 'O convite não foi concluído. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({ user: toSafeUser({ ...invitedUser, app_metadata: { ...invitedUser.app_metadata, role: body.role } }) }, { status: 201 })
  } catch (error) {
    console.error('Falha ao criar acesso:', error)
    return NextResponse.json({ error: 'Não foi possível criar o acesso. Verifique a chave administrativa do servidor.' }, { status: 503 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if ('response' in auth) return auth.response

  let body: { userId?: unknown; role?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  if (typeof body.userId !== 'string' || !body.userId) {
    return NextResponse.json({ error: 'A conta selecionada é inválida.' }, { status: 400 })
  }
  if (!isAppRole(body.role)) {
    return NextResponse.json({ error: 'Selecione um perfil válido.' }, { status: 400 })
  }
  if (body.userId === auth.user.id && body.role !== 'admin') {
    return NextResponse.json({ error: 'Não é possível remover seu próprio perfil de administrador.' }, { status: 409 })
  }

  try {
    const adminClient = createAdminClient()
    const users = await listAllUsers(adminClient)
    const target = users.find(user => user.id === body.userId)
    if (!target) return NextResponse.json({ error: 'A conta selecionada não existe.' }, { status: 404 })

    const adminCount = users.filter(user => user.app_metadata?.role === 'admin').length
    if (target.app_metadata?.role === 'admin' && body.role !== 'admin' && adminCount <= 1) {
      return NextResponse.json({ error: 'O sistema precisa manter pelo menos um administrador.' }, { status: 409 })
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(target.id, {
      app_metadata: { ...target.app_metadata, role: body.role },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ user: toSafeUser(data.user) })
  } catch (error) {
    console.error('Falha ao alterar perfil:', error)
    return NextResponse.json({ error: 'Não foi possível alterar o perfil. Verifique a chave administrativa do servidor.' }, { status: 503 })
  }
}
