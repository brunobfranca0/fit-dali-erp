// TypeScript / app/api/admin/api-keys/[id]/route.ts / Node.js / Next.js Route Handler
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest, context: RouteContext<'/api/admin/api-keys/[id]'>) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Entre novamente para continuar.' }, { status: 401 })
  if (user.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'Apenas administradores podem gerenciar API keys.' }, { status: 403 })
  const { id } = await context.params
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('crm_api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Chave não encontrada ou já revogada.' }, { status: 404 })
    return NextResponse.json({ revoked: true })
  } catch (error) {
    console.error('Falha ao revogar API key:', error)
    return NextResponse.json({ error: 'Não foi possível revogar a chave.' }, { status: 503 })
  }
}
