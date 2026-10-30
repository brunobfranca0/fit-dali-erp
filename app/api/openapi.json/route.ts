// TypeScript / app/api/openapi.json/route.ts / Node.js / Next.js Route Handler
import { NextResponse } from 'next/server'
import { crmOpenApiSpec } from '@/lib/api/openapi'

export function GET() {
  return NextResponse.json(crmOpenApiSpec, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  })
}
