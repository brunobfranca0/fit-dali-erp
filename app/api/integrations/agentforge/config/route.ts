// TypeScript / app/api/integrations/agentforge/config/route.ts / Node.js / Next.js Route Handler
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret } from '@/lib/integrations/agentforge'

export const runtime = 'nodejs'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return !error && user?.app_metadata?.role === 'admin' ? user : null
}

export async function GET(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Apenas administradores podem configurar integrações.' }, { status: 403 })
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('agentforge_connections')
      .select('api_key_ciphertext, webhook_secret_ciphertext, agent_id, updated_at')
      .eq('id', 'primary')
      .maybeSingle()
    if (error) throw error
    return NextResponse.json({
      configured: Boolean(data?.api_key_ciphertext),
      webhookConfigured: Boolean(data?.webhook_secret_ciphertext),
      agentId: data?.agent_id ?? '',
      updatedAt: data?.updated_at ?? null,
      webhookUrl: new URL('/api/integrations/agentforge/webhook', process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).toString(),
    })
  } catch (error) {
    console.error('Falha ao carregar integração AgentForge:', error)
    return NextResponse.json({ error: 'Não foi possível carregar a integração. Confira as migrations e as chaves do servidor.' }, { status: 503 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await isAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas administradores podem configurar integrações.' }, { status: 403 })

  let body: { apiKey?: unknown; webhookSecret?: unknown; agentId?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
  const webhookSecret = typeof body.webhookSecret === 'string' ? body.webhookSecret.trim() : ''
  const agentId = typeof body.agentId === 'string' ? body.agentId.trim() : ''
  if ((apiKey && apiKey.length > 512) || (webhookSecret && webhookSecret.length > 512) || agentId.length > 256) {
    return NextResponse.json({ error: 'Um dos campos excede o tamanho permitido.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data: existing, error: readError } = await admin.from('agentforge_connections')
      .select('api_key_ciphertext, webhook_secret_ciphertext')
      .eq('id', 'primary')
      .maybeSingle()
    if (readError) throw readError
    if (!apiKey && !existing?.api_key_ciphertext) {
      return NextResponse.json({ error: 'Informe a chave de API do AgentForge.' }, { status: 400 })
    }
    if (!webhookSecret && !existing?.webhook_secret_ciphertext) {
      return NextResponse.json({ error: 'Informe o segredo de assinatura do webhook.' }, { status: 400 })
    }

    const { error } = await admin.from('agentforge_connections').upsert({
      id: 'primary',
      api_key_ciphertext: apiKey ? encryptSecret(apiKey) : existing!.api_key_ciphertext,
      webhook_secret_ciphertext: webhookSecret ? encryptSecret(webhookSecret) : existing!.webhook_secret_ciphertext,
      agent_id: agentId || null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    if (error) throw error
    return NextResponse.json({ saved: true })
  } catch (error) {
    console.error('Falha ao salvar integração AgentForge:', error)
    return NextResponse.json({ error: 'Não foi possível salvar. Confira a migration e INTEGRATIONS_ENCRYPTION_KEY no servidor.' }, { status: 503 })
  }
}
