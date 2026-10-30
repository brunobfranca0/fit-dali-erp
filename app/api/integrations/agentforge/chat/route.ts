// TypeScript / app/api/integrations/agentforge/chat/route.ts / Node.js / Next.js Route Handler
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret, getAgentForgeConnection, agentForgeRequest } from '@/lib/integrations/agentforge'
import { isAppRole } from '@/lib/auth/roles'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role
  if (authError || !user || !isAppRole(role) || !['admin', 'gestor', 'atendimento'].includes(role)) {
    return NextResponse.json({ error: 'Seu perfil não pode conversar com o agente.' }, { status: 403 })
  }

  let body: { message?: unknown; sessionId?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 })
  }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  if (!message || message.length > 4000 || !/^[A-Za-z0-9_-]{8,128}$/.test(sessionId)) {
    return NextResponse.json({ error: 'Informe uma mensagem de até 4.000 caracteres.' }, { status: 400 })
  }

  try {
    const connection = await getAgentForgeConnection()
    if (!connection?.api_key_ciphertext || !connection.agent_id) {
      return NextResponse.json({ error: 'Configure a chave de API e o ID do agente em Integrações.' }, { status: 409 })
    }
    const apiKey = decryptSecret(connection.api_key_ciphertext)
    const response = await agentForgeRequest(`/agents/${encodeURIComponent(connection.agent_id)}/chat`, apiKey, {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    })
    const content = await response.text()
    if (content.length > 64_000) return NextResponse.json({ error: 'Resposta do agente excede o limite.' }, { status: 502 })
    let result: unknown
    try { result = JSON.parse(content) } catch { result = { message: content } }
    if (!response.ok) return NextResponse.json({ error: `AgentForge respondeu com HTTP ${response.status}.` }, { status: 502 })
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Falha na chamada ao AgentForge:', error)
    return NextResponse.json({ error: 'Não foi possível enviar a mensagem ao agente.' }, { status: 503 })
  }
}
