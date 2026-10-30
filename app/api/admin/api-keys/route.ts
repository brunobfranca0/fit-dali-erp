// TypeScript / app/api/admin/api-keys/route.ts / Node.js / Next.js Route Handler
import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { response: NextResponse.json({ error: 'Entre novamente para continuar.' }, { status: 401 }) }
  if (user.app_metadata?.role !== 'admin') return { response: NextResponse.json({ error: 'Apenas administradores podem gerenciar API keys.' }, { status: 403 }) }
  return { user }
}

export async function GET() {
  const auth = await requireAdmin()
  if ('response' in auth) return auth.response
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('crm_api_keys')
      .select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ keys: data })
  } catch (error) {
    console.error('Falha ao listar API keys:', error)
    return NextResponse.json({ error: 'Não foi possível listar as chaves. Confira a migration e a chave administrativa do servidor.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('response' in auth) return auth.response
  let body: { name?: unknown; access?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const access = body.access === 'read-write' ? 'read-write' : body.access === 'read-only' ? 'read-only' : null
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: 'O nome precisa ter entre 2 e 80 caracteres.' }, { status: 400 })
  if (!access) return NextResponse.json({ error: 'Selecione o nível de acesso da chave.' }, { status: 400 })

  try {
    const rawKey = `fdcrm_${randomBytes(32).toString('base64url')}`
    const keyHash = createHash('sha256').update(rawKey, 'utf8').digest('hex')
    const admin = createAdminClient()
    const { data, error } = await admin.from('crm_api_keys').insert({
      name,
      key_prefix: rawKey.slice(0, 14),
      key_hash: keyHash,
      scopes: access === 'read-write' ? ['crm:read', 'crm:write'] : ['crm:read'],
      created_by: auth.user.id,
    }).select('id, name, key_prefix, scopes, created_at').single()
    if (error) throw error
    return NextResponse.json({ key: { ...data, secret: rawKey } }, {
      status: 201,
      headers: { 'Cache-Control': 'no-store, private' },
    })
  } catch (error) {
    console.error('Falha ao criar API key:', error)
    return NextResponse.json({ error: 'Não foi possível criar a chave. Confira a migration e a chave administrativa do servidor.' }, { status: 503 })
  }
}
