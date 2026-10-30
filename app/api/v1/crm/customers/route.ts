// TypeScript / app/api/v1/crm/customers/route.ts / Node.js / Fit DaLi ERP public REST API
import { NextRequest, NextResponse } from 'next/server'
import { authenticateCrmApi, apiError } from '@/lib/api/public-auth'

export const runtime = 'nodejs'

function pageSize(value: string | null) {
  const parsed = Number(value ?? 50)
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 100) : 50
}

export async function GET(request: NextRequest) {
  const auth = await authenticateCrmApi(request, 'crm:read')
  if ('response' in auth) return auth.response
  const params = request.nextUrl.searchParams
  const limit = pageSize(params.get('limit'))
  const rawOffset = Number(params.get('offset') ?? 0)
  const offset = Number.isInteger(rawOffset) ? Math.max(0, Math.min(rawOffset, 1_000_000)) : 0
  const search = (params.get('search') ?? '').trim().slice(0, 100)

  let query = auth.client.from('customers').select('id,name,phone,email,address,notes,created_at,updated_at', { count: 'exact' })
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (search) query = query.ilike('name', `%${search.replace(/[\\%_]/g, '\\$&')}%`)
  const { data, count, error } = await query
  if (error) return apiError('Não foi possível listar clientes.', 503, 'database_error')
  return NextResponse.json({ data, meta: { limit, offset, total: count ?? 0 } })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateCrmApi(request, 'crm:write')
  if ('response' in auth) return auth.response
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return apiError('O corpo precisa ser um objeto JSON.')
    body = parsed as Record<string, unknown>
  } catch { return apiError('JSON inválido.') }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 180) return apiError('Informe um nome de até 180 caracteres.')
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : null
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : null
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError('E-mail inválido.')

  const { data, error } = await auth.client.from('customers').insert({
    name,
    phone: phone || null,
    email: email || null,
    address: typeof body.address === 'string' ? body.address.trim().slice(0, 500) || null : null,
    notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 4000) || null : null,
  }).select('id,name,phone,email,address,notes,created_at,updated_at').single()
  if (error) return apiError('Não foi possível criar o cliente.', 422, 'validation_error')
  return NextResponse.json({ data }, { status: 201 })
}
