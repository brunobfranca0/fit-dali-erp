// TypeScript / lib/api/openapi.ts / Node.js / OpenAPI 3.1 / Fit DaLi ERP public CRM API
export const crmOpenApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Fit DaLi ERP — API pública do CRM',
    version: '1.0.0',
    description: 'API REST para clientes e leads do Fit DaLi ERP. Autentique cada chamada com uma API key no header Authorization: Bearer. Chaves são criadas e revogadas por um administrador no ERP.',
  },
  servers: [{ url: '/api/v1', description: 'API pública do Fit DaLi ERP' }],
  tags: [
    { name: 'Clientes', description: 'Contatos registrados na base de clientes do ERP.' },
    { name: 'Leads', description: 'Leads e oportunidades acompanhados no funil do CRM.' },
  ],
  security: [{ BearerApiKey: [] }],
  paths: {
    '/crm/customers': {
      get: {
        tags: ['Clientes'], operationId: 'listCustomers', summary: 'Listar clientes',
        description: 'Retorna clientes com paginação por limit/offset. Requer escopo crm:read.',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string', maxLength: 100 }, description: 'Filtra pelo nome do cliente.' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
        ],
        responses: {
          '200': { description: 'Página de clientes.', content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerList' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '503': { $ref: '#/components/responses/Unavailable' },
        },
      },
      post: {
        tags: ['Clientes'], operationId: 'createCustomer', summary: 'Criar cliente', description: 'Requer escopo crm:write.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCustomer' }, example: { name: 'Ana Souza', phone: '+5511999990000', email: 'ana@example.com', notes: 'Prefere contato pelo WhatsApp.' } } } },
        responses: {
          '201': { description: 'Cliente criado.', content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerResponse' } } } },
          '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/crm/leads': {
      get: {
        tags: ['Leads'], operationId: 'listCrmLeads', summary: 'Listar leads', description: 'Filtra e pagina leads do funil. Requer escopo crm:read.',
        parameters: [
          { name: 'stage', in: 'query', schema: { $ref: '#/components/schemas/LeadStage' } },
          { name: 'search', in: 'query', schema: { type: 'string', maxLength: 100 }, description: 'Filtra pelo nome do contato.' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
        ],
        responses: {
          '200': { description: 'Página de leads.', content: { 'application/json': { schema: { $ref: '#/components/schemas/LeadList' } } } },
          '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '503': { $ref: '#/components/responses/Unavailable' },
        },
      },
      post: {
        tags: ['Leads'], operationId: 'createCrmLead', summary: 'Criar lead', description: 'Cria uma oportunidade no funil. Requer escopo crm:write.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLead' }, example: { contactName: 'Ana Souza', phone: '+5511999990000', email: 'ana@example.com', stage: 'novo', source: 'AgentForge', notes: 'Solicitou o cardápio da semana.' } } } },
        responses: {
          '201': { description: 'Lead criado.', content: { 'application/json': { schema: { $ref: '#/components/schemas/LeadResponse' } } } },
          '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/crm/leads/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Leads'], operationId: 'getCrmLead', summary: 'Consultar lead', description: 'Requer escopo crm:read.',
        responses: {
          '200': { description: 'Lead encontrado.', content: { 'application/json': { schema: { $ref: '#/components/schemas/LeadResponse' } } } },
          '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' }, '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Leads'], operationId: 'updateCrmLead', summary: 'Atualizar lead', description: 'Atualiza os campos informados. Requer escopo crm:write.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateLead' }, example: { stage: 'qualificado', notes: 'Cliente confirmou interesse.' } } } },
        responses: {
          '200': { description: 'Lead atualizado.', content: { 'application/json': { schema: { $ref: '#/components/schemas/LeadResponse' } } } },
          '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { $ref: '#/components/responses/NotFound' }, '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
  },
  components: {
    securitySchemes: { BearerApiKey: { type: 'http', scheme: 'bearer', bearerFormat: 'fdcrm_…', description: 'Gere uma API key em Painel → API pública e informe aqui o token completo.' } },
    schemas: {
      LeadStage: { type: 'string', enum: ['novo', 'contato', 'qualificado', 'convertido', 'perdido'] },
      Customer: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, phone: { type: ['string', 'null'] }, email: { type: ['string', 'null'] }, address: { type: ['string', 'null'] }, notes: { type: ['string', 'null'] }, created_at: { type: 'string', format: 'date-time' }, updated_at: { type: 'string', format: 'date-time' } } },
      CreateCustomer: { type: 'object', required: ['name'], properties: { name: { type: 'string', maxLength: 180 }, phone: { type: 'string', maxLength: 40 }, email: { type: 'string', format: 'email' }, address: { type: 'string', maxLength: 500 }, notes: { type: 'string', maxLength: 4000 } } },
      CustomerResponse: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } },
      CustomerList: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } }, meta: { $ref: '#/components/schemas/Pagination' } } },
      Lead: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, customer_id: { type: ['string', 'null'], format: 'uuid' }, contact_name: { type: 'string' }, phone: { type: ['string', 'null'] }, email: { type: ['string', 'null'], format: 'email' }, stage: { $ref: '#/components/schemas/LeadStage' }, source: { type: 'string' }, notes: { type: 'string' }, last_activity_at: { type: 'string', format: 'date-time' }, created_at: { type: 'string', format: 'date-time' }, updated_at: { type: 'string', format: 'date-time' } } },
      CreateLead: { type: 'object', required: ['contactName'], properties: { customerId: { type: 'string', format: 'uuid' }, contactName: { type: 'string', maxLength: 180 }, phone: { type: 'string', maxLength: 40 }, email: { type: 'string', format: 'email' }, stage: { $ref: '#/components/schemas/LeadStage' }, source: { type: 'string', maxLength: 80 }, notes: { type: 'string', maxLength: 4000 }, agentForgeSessionId: { type: 'string', maxLength: 512 }, agentForgeConversationId: { type: 'string', maxLength: 512 } } },
      UpdateLead: { type: 'object', minProperties: 1, properties: { contactName: { type: 'string', maxLength: 180 }, phone: { type: ['string', 'null'], maxLength: 40 }, email: { type: ['string', 'null'], format: 'email' }, stage: { $ref: '#/components/schemas/LeadStage' }, source: { type: 'string', maxLength: 80 }, notes: { type: 'string', maxLength: 4000 } } },
      LeadResponse: { type: 'object', properties: { data: { $ref: '#/components/schemas/Lead' } } },
      LeadList: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Lead' } }, meta: { $ref: '#/components/schemas/Pagination' } } },
      Pagination: { type: 'object', properties: { limit: { type: 'integer' }, offset: { type: 'integer' }, total: { type: 'integer' } } },
      Error: { type: 'object', properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } }, required: ['code', 'message'] } } },
    },
    responses: {
      BadRequest: { description: 'Parâmetro ou JSON inválido.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      Unauthorized: { description: 'API key ausente, inválida ou revogada.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      Forbidden: { description: 'A API key não possui o escopo necessário.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      NotFound: { description: 'Registro não encontrado.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      ValidationError: { description: 'O registro não passou pela validação.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      Unavailable: { description: 'Serviço temporariamente indisponível.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
} as const
