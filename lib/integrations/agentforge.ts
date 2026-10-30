// TypeScript / lib/integrations/agentforge.ts / Node.js / Fit DaLi ERP server integration
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = 'https://agentforge.solutions/api'

function encryptionKey() {
  const secret = process.env.INTEGRATIONS_ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new Error('Configure INTEGRATIONS_ENCRYPTION_KEY com pelo menos 32 caracteres.')
  }
  return createHash('sha256').update(secret, 'utf8').digest()
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptSecret(value: string) {
  const [version, iv, tag, ciphertext] = value.split('.')
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Credencial armazenada inválida.')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export async function getAgentForgeConnection() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agentforge_connections')
    .select('api_key_ciphertext, webhook_secret_ciphertext, agent_id')
    .eq('id', 'primary')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function agentForgeRequest(path: string, apiKey: string, init?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
    signal: init?.signal ?? AbortSignal.timeout(12_000),
  })
}
