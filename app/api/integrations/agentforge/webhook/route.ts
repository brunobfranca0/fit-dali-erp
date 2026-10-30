// TypeScript / app/api/integrations/agentforge/webhook/route.ts / Node.js / Next.js Route Handler
import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret, getAgentForgeConnection } from '@/lib/integrations/agentforge'

export const runtime = 'nodejs'

function verifySignature(payload: string, signature: string, secret: string) {
  const expected = `sha256=${createHmac('sha256', secret).update(payload, 'utf8').digest('hex')}`
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

function safeText(value: unknown) {
  return typeof value === 'string' && value.length <= 512 ? value : null
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  if (rawBody.length > 128_000) return NextResponse.json({ error: 'Evento excede o limite.' }, { status: 413 })
  let payload: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Objeto esperado.')
    payload = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const signature = request.headers.get('x-agentforge-signature') ?? ''
  try {
    const connection = await getAgentForgeConnection()
    if (!connection?.webhook_secret_ciphertext) return NextResponse.json({ error: 'Integração ainda não configurada.' }, { status: 503 })
    const secret = decryptSecret(connection.webhook_secret_ciphertext)
    // AgentForge documents signing JSON.stringify(payload); retain its property order after parsing.
    const signedPayload = JSON.stringify(payload)
    if (!verifySignature(signedPayload, signature, secret)) {
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
    }

    const data = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? payload.data as Record<string, unknown>
      : {}
    const eventName = safeText(payload.event)
    if (!eventName) return NextResponse.json({ error: 'Evento sem nome válido.' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('agentforge_events').upsert({
      payload_hash: createHash('sha256').update(signedPayload).digest('hex'),
      event_name: eventName,
      agent_id: safeText(payload.agentId),
      conversation_id: safeText(data.conversationId),
      session_id: safeText(data.sessionId),
      payload,
    }, { onConflict: 'payload_hash', ignoreDuplicates: true })
    if (error) throw error

    const sessionId = safeText(data.sessionId)
    if (sessionId) {
      const { error: activityError } = await admin.from('crm_leads')
        .update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('agentforge_session_id', sessionId)
      if (activityError) throw activityError
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Falha ao processar webhook AgentForge:', error)
    return NextResponse.json({ error: 'Não foi possível processar o evento.' }, { status: 503 })
  }
}
