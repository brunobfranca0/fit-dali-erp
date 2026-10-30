// TypeScript / app/api/integrations/agentforge/test/route.ts / Node.js / Next.js Route Handler
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret, getAgentForgeConnection, agentForgeRequest } from '@/lib/integrations/agentforge'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || user?.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores podem testar a conexão.' }, { status: 403 })
  }

  try {
    const connection = await getAgentForgeConnection()
    if (!connection?.api_key_ciphertext) return NextResponse.json({ error: 'Salve a chave de API antes de testar.' }, { status: 400 })
    const apiKey = decryptSecret(connection.api_key_ciphertext)
    const response = await agentForgeRequest('/agents', apiKey)
    if (!response.ok) return NextResponse.json({ error: `AgentForge respondeu com HTTP ${response.status}. Confira a chave e o plano da conta.` }, { status: 502 })
    const result: unknown = await response.json()
    const agents = Array.isArray(result) ? result : (result && typeof result === 'object' && Array.isArray((result as { agents?: unknown }).agents) ? (result as { agents: unknown[] }).agents : [])
    return NextResponse.json({ connected: true, agentCount: agents.length })
  } catch (error) {
    console.error('Falha ao testar conexão AgentForge:', error)
    return NextResponse.json({ error: 'Não foi possível testar a conexão. Confira a configuração do servidor e a migration.' }, { status: 503 })
  }
}
