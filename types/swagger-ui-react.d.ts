// TypeScript / types/swagger-ui-react.d.ts / TypeScript declarations / Swagger UI React
declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react'

  interface SwaggerUIProps {
    url?: string
    spec?: Record<string, unknown>
    docExpansion?: 'list' | 'full' | 'none'
    defaultModelsExpandDepth?: number
    displayRequestDuration?: boolean
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>
  export default SwaggerUI
}
