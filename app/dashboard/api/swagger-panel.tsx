// TypeScript / app/dashboard/api/swagger-panel.tsx / React 19 / Swagger UI for Fit DaLi ERP
'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-slate-500">Carregando referência OpenAPI…</div>,
})

export default function SwaggerPanel() {
  return <div className="swagger-fitdali"><SwaggerUI url="/api/openapi.json" docExpansion="list" defaultModelsExpandDepth={1} displayRequestDuration /></div>
}
