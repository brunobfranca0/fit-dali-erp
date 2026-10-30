# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-10-30

### ✨ Adicionado

#### Core
- Sistema ERP completo para marmitaria
- Arquitetura Next.js 16 com App Router
- Integração completa com Supabase (PostgreSQL + Auth)
- TypeScript para type safety
- Tailwind CSS para estilização

#### Autenticação
- Login seguro com Supabase Auth
- Middleware automático para proteção de rotas
- Sessão persistente com cookies
- Logout funcional

#### Dashboard
- Métricas em tempo real (pedidos hoje, pendentes, receita)
- Cards animados com estatísticas
- Lista de pedidos recentes
- Quick actions para módulos principais
- Design responsivo mobile-first

#### Gestão de Pedidos
- CRUD completo de pedidos
- Sistema de status (pendente → confirmado → preparando → pronto → entregue → cancelado)
- Cálculo automático de preços com combos (unidade, c10, c20)
- Modal de criação de pedidos intuitivo
- Filtros por status e busca
- Cards visuais com informações completas
- Ações rápidas por status

#### Gestão de Clientes
- CRUD completo de clientes
- Campos: nome, telefone, email, endereço, observações
- Busca em tempo real
- Cards com avatar colorido
- Links diretos para telefone/email

#### Gestão de Produtos
- Gerenciamento de categorias com cores personalizadas
- Sistema de preços progressivos (unidade, combo 10, combo 20)
- CRUD de produtos vinculados a categorias
- Status ativo/inativo
- Tabela responsiva de produtos

#### Relatórios
- Gráfico de receita por dia (Line Chart)
- Gráfico de pedidos por status (Pie Chart)
- Top 5 produtos (Bar Chart)
- Filtro por período
- Cards de métricas consolidadas
- Exportação de dados (preparado para PDF)

#### UI/UX
- Design inspirado em Stripe + Kokonut UI
- Animações suaves (slide-up, fade-in)
- Gradientes para CTAs
- Glass morphism em modais
- Sistema de cores consistente
- Ícones Lucide React
- Sidebar responsiva com drawer mobile
- Loading states em todas as operações

#### Database
- Schema completo PostgreSQL
- 8 tabelas principais
- Row Level Security (RLS) habilitado
- Políticas de acesso para authenticated users
- Indexes para performance
- Triggers para updated_at
- Relacionamentos com foreign keys
- Dados iniciais (4 categorias padrão)

### 📝 Documentação
- README.md completo com setup e features
- QUICKSTART.md para instalação rápida
- Schema SQL comentado
- Dados de exemplo opcionais
- Estrutura do projeto documentada

### 🎨 Design System
- Cores da marca Fit DaLi (#d42a6f pink principal)
- Paleta de cores para categorias
- Componentes reutilizáveis
- Responsividade mobile-first
- Dark mode preparado (variáveis CSS)

### 🔒 Segurança
- RLS em todas as tabelas
- Autenticação JWT
- Validação de formulários
- Sanitização de inputs
- Middleware de sessão

### 🚀 Performance
- Next.js 16 com Turbopack
- Server Components onde possível
- Lazy loading de componentes
- Otimização de imagens
- Cache de dados

---

## [Próximas Versões]

### [1.1.0] - Em Breve
- [ ] Módulo de Produção Diária completo
- [ ] Impressão de pedidos em PDF
- [ ] QR Code para cardápio digital
- [ ] WhatsApp integration para notificações
- [ ] Controle de caixa

### [1.2.0] - Planejado
- [ ] Sistema de fidelidade
- [ ] Multi-usuário com permissões
- [ ] Relatórios avançados com BI
- [ ] App mobile (React Native)
- [ ] Integração iFood/Rappi

---

**Legenda:**
- ✨ Adicionado: Novas features
- 🐛 Corrigido: Bug fixes
- 🔄 Alterado: Mudanças em features existentes
- 🗑️ Removido: Features removidas
- 🔒 Segurança: Melhorias de segurança
- 📝 Documentação: Mudanças na documentação
