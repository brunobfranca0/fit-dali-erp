// TypeScript / app/api/v1/crm/leads/route.ts / Node.js / Fit DaLi ERP public REST API
import { NextRequest, NextResponse } from 'next/server'
import { authenticateCrmApi, apiError } from '@/lib/api/public-auth'

export const runtime = 'nodejs'

const stages = ['novo', 'contato', 'qualificado', 'convertido', 'perdido'] as const
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function positiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback)
  return Number.isInteger(parsed) ? Math.max(0, Math.min(parsed, max)) : fallback
}

export async function GET(request: NextRequest) {
  const auth = await authenticateCrmApi(request, 'crm:read')
  if ('response' in auth) return auth.response
  const params = request.nextUrl.searchParams
  const limit = Math.min(positiveInt(params.get('limit'), 50, 100), 100) || 50
  const offset = positiveInt(params.get('offset'), 0, 1_000_000)
  const stage = params.get('stage')
  if (stage && !stages.includes(stage as (typeof stages)[number])) return apiError('Etapa inválida.')
  const querySearch = (params.get('search') ?? '').trim().slice(0, 100)

  let query = auth.client.from('crm_leads').select('id,customer_id,contact_name,phone,email,stage,source,agentforge_session_id,agentforge_conversation_id,notes,last_activity_at,created_at,updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false }).range(offset, offset + limit - 1)
  if (stage) query = query.eq('stage', stage)
  if (querySearch) query = query.ilike('contact_name', `%${querySearch.replace(/[\\%_]/g, '\\$&')}%`)
  const { data, count, error } = await query
  if (error) return apiError('Não foi possível listar leads.', 503, 'database_error')
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

  const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : ''
  if (!contactName || contactName.length > 180) return apiError('Informe contactName com até 180 caracteres.')
  const stage = typeof body.stage === 'string' ? body.stage : 'novo'
  if (!stages.includes(stage as (typeof stages)[number])) return apiError('Etapa inválida.')
  const customerId = typeof body.customerId === 'string' && uuidPattern.test(body.customerId) ? body.customerId : null
  if (body.customerId && !customerId) return apiError('customerId precisa ser um UUID válido.')
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : null
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError('E-mail inválido.')

  const { data, error } = await auth.client.from('crm_leads').insert({
    customer_id: customerId,
    contact_name: contactName,
    phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) || null : null,
    email: email || null,
    stage,
    source: typeof body.source === 'string' ? body.source.trim().slice(0, 80) || 'api' : 'api',
    notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 4000) : '',
    agentforge_session_id: typeof body.agentForgeSessionId === 'string' ? body.agentForgeSessionId.trim().slice(0, 512) || null : null,
    agentforge_conversation_id: typeof body.agentForgeConversationId === 'string' ? body.agentForgeConversationId.trim().slice(0, 512) || null : null,
  }).select('*').single()
  if (error) return apiError('Não foi possível criar o lead.', 422, 'validation_error')
  return NextResponse.json({ data }, { status: 201 })
}
