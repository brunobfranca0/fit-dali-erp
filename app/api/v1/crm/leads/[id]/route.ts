// TypeScript / app/api/v1/crm/leads/[id]/route.ts / Node.js / Fit DaLi ERP public REST API
import { NextRequest, NextResponse } from 'next/server'
import { authenticateCrmApi, apiError } from '@/lib/api/public-auth'

export const runtime = 'nodejs'

const stages = ['novo', 'contato', 'qualificado', 'convertido', 'perdido'] as const
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest, context: RouteContext<'/api/v1/crm/leads/[id]'>) {
  const auth = await authenticateCrmApi(request, 'crm:read')
  if ('response' in auth) return auth.response
  const { id } = await context.params
  if (!uuidPattern.test(id)) return apiError('ID inválido.', 400, 'invalid_id')
  const { data, error } = await auth.client.from('crm_leads').select('*').eq('id', id).maybeSingle()
  if (error) return apiError('Não foi possível carregar o lead.', 503, 'database_error')
  if (!data) return apiError('Lead não encontrado.', 404, 'not_found')
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, context: RouteContext<'/api/v1/crm/leads/[id]'>) {
  const auth = await authenticateCrmApi(request, 'crm:write')
  if ('response' in auth) return auth.response
  const { id } = await context.params
  if (!uuidPattern.test(id)) return apiError('ID inválido.', 400, 'invalid_id')
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return apiError('O corpo precisa ser um objeto JSON.')
    body = parsed as Record<string, unknown>
  } catch { return apiError('JSON inválido.') }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('contactName' in body) {
    if (typeof body.contactName !== 'string' || !body.contactName.trim() || body.contactName.trim().length > 180) return apiError('contactName inválido.')
    update.contact_name = body.contactName.trim()
  }
  if ('phone' in body) update.phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) || null : null
  if ('email' in body) {
    if (typeof body.email === 'string' && body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return apiError('E-mail inválido.')
    update.email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) || null : null
  }
  if ('stage' in body) {
    if (typeof body.stage !== 'string' || !stages.includes(body.stage as (typeof stages)[number])) return apiError('Etapa inválida.')
    update.stage = body.stage
  }
  if ('source' in body) update.source = typeof body.source === 'string' ? body.source.trim().slice(0, 80) : 'api'
  if ('notes' in body) update.notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 4000) : ''
  if (Object.keys(update).length === 1) return apiError('Informe ao menos um campo para atualizar.')

  const { data, error } = await auth.client.from('crm_leads').update(update).eq('id', id).select('*').maybeSingle()
  if (error) return apiError('Não foi possível atualizar o lead.', 422, 'validation_error')
  if (!data) return apiError('Lead não encontrado.', 404, 'not_found')
  return NextResponse.json({ data })
}
