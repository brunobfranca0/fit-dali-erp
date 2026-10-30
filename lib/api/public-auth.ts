// TypeScript / lib/api/public-auth.ts / Node.js / Fit DaLi ERP public CRM API
import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type CrmApiScope = 'crm:read' | 'crm:write'

export async function authenticateCrmApi(request: NextRequest, requiredScope: CrmApiScope) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(fdcrm_[A-Za-z0-9_-]{32,})$/i.exec(authorization)
  if (!match) {
    return { response: NextResponse.json({ error: { code: 'unauthorized', message: 'Envie uma API key no header Authorization: Bearer.' } }, { status: 401 }) }
  }

  try {
    const client = createAdminClient()
    const keyHash = createHash('sha256').update(match[1], 'utf8').digest('hex')
    const { data: apiKey, error } = await client.from('crm_api_keys')
      .select('id, scopes')
      .eq('key_hash', keyHash)
      .is('revoked_at', null)
      .maybeSingle()
    if (error) throw error
    if (!apiKey) {
      return { response: NextResponse.json({ error: { code: 'invalid_api_key', message: 'A API key é inválida ou foi revogada.' } }, { status: 401 }) }
    }
    if (!(apiKey.scopes as string[]).includes(requiredScope)) {
      return { response: NextResponse.json({ error: { code: 'insufficient_scope', message: `Esta chave precisa do escopo ${requiredScope}.` } }, { status: 403 }) }
    }
    await client.from('crm_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id)
    return { client, apiKeyId: apiKey.id }
  } catch (error) {
    console.error('Falha na autenticação da API pública do CRM:', error)
    return { response: NextResponse.json({ error: { code: 'service_unavailable', message: 'A API está temporariamente indisponível.' } }, { status: 503 }) }
  }
}

export function apiError(message: string, status = 400, code = 'bad_request') {
  return NextResponse.json({ error: { code, message } }, { status })
}
