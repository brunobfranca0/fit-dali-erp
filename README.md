# Fit DaLi - Sistema de Gestão ERP

Sistema ERP moderno e completo para gestão de marmitaria, desenvolvido com Next.js 16, TypeScript, Tailwind CSS e Supabase.

![Fit DaLi](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-green?style=for-the-badge&logo=supabase)

## 🎯 Funcionalidades

### ✅ Implementadas

- **Autenticação Completa**: Login seguro com Supabase Auth
- **Dashboard Intuitivo**: Métricas em tempo real, pedidos do dia, receitas
- **Gestão de Pedidos**: CRUD completo com status tracking (pendente → confirmado → preparando → pronto → entregue)
- **Sistema de Clientes**: Cadastro completo com telefone, email e endereço
- **Cardápio & Produtos**: Categorias com preços progressivos (unidade, combo 10, combo 20)
- **Relatórios Visuais**: Gráficos de receita, top produtos, status de pedidos
- **Design Responsivo**: Interface adaptável mobile-first
- **Animações Suaves**: Transições inspiradas em Kokonut UI

### 🚧 Em Desenvolvimento

- Módulo de Produção Diária
- Impressão de Pedidos (PDF/Térmico)
- QR Code para Cardápio Digital
- Notificações WhatsApp
- Controle de Caixa
- Tema Escuro

## 🚀 Tecnologias

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Charts**: Recharts
- **Ícones**: Lucide React
- **Deploy**: Vercel (recomendado)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ e npm/pnpm/yarn
- Conta Supabase (gratuita)

### 1. Clone e Instale

```bash
cd fit-dali-erp
npm install
```

### 2. Configure o Supabase

#### 2.1 Crie um Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a **URL** e a **anon key** do projeto

#### 2.2 Execute o Schema SQL

1. No Dashboard do Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo de `supabase/schema.sql`
3. Execute o script (cria todas as tabelas, políticas RLS e dados iniciais)

#### 2.3 Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.local.example .env.local

# Edite .env.local com suas credenciais
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
```

#### 2.4 Crie um Usuário no Supabase Auth

1. No Dashboard do Supabase, vá em **Authentication > Users**
2. Clique em **Add user**
3. Cadastre um email e senha
4. Use essas credenciais para fazer login no sistema

### 3. Execute o Projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

O projeto usa um design inspirado no Stripe + cores da Fit DaLi:

### Cores Principais

```css
--pink: #d42a6f      /* CTA primário */
--green: #10b981     /* Fit */
--blue: #3b82f6      /* Light */
--amber: #f59e0b     /* Alerta */
--red: #ef4444       /* Proteica */
```

### Componentes do Kokonut UI

Inspirado em componentes do [kokonutui.com](https://kokonutui.com):
- Cards com hover effects
- Animações slide-up
- Glass morphism em modais
- Gradientes para CTAs

## 📁 Estrutura do Projeto

```
fit-dali-erp/
├── app/
│   ├── login/              # Página de login
│   ├── dashboard/          # Dashboard principal
│   │   ├── orders/         # Gestão de pedidos
│   │   ├── customers/      # Gestão de clientes
│   │   ├── products/       # Produtos e categorias
│   │   ├── production/     # Produção (em dev)
│   │   ├── reports/        # Relatórios e gráficos
│   │   └── settings/       # Configurações (em dev)
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase/           # Cliente Supabase (server/client/middleware)
│   ├── types.ts            # Tipos TypeScript
│   └── utils.ts            # Funções utilitárias
├── supabase/
│   └── schema.sql          # Schema completo do banco
├── .env.local              # Variáveis de ambiente
└── README.md
```

## 🗄️ Schema do Banco

### Tabelas Principais

- **categories**: Categorias de produtos (Fit, Light, Vegano, Proteica)
- **products**: Produtos do cardápio
- **customers**: Clientes cadastrados
- **orders**: Pedidos
- **order_items**: Itens de cada pedido
- **payments**: Pagamentos recebidos
- **daily_production**: Produção diária
- **expenses**: Despesas

### Políticas RLS

Todas as tabelas possuem Row Level Security habilitado com políticas para usuários autenticados.

## 🔒 Segurança

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Autenticação JWT com Supabase Auth
- ✅ Middleware de sessão automático
- ✅ Validação de formulários client-side
- ✅ HTTPS obrigatório em produção

## 🚢 Deploy

### Vercel (Recomendado)

```bash
# Instale o Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure as env vars no dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Outras Opções

- **Netlify**: Compatible com Next.js 16
- **Railway**: Deploy automático via Git
- **Docker**: Use o Dockerfile incluído (se disponível)

## 📱 Responsividade

O sistema é totalmente responsivo:

- **Mobile**: 320px+ (sidebar em drawer)
- **Tablet**: 768px+ (layout adaptativo)
- **Desktop**: 1024px+ (sidebar fixa)

## 🎯 Roadmap

### Curto Prazo (1-2 semanas)

- [ ] Módulo de Produção Diária completo
- [ ] Impressão de pedidos em PDF
- [ ] QR Code para cardápio digital
- [ ] Notificações por email

### Médio Prazo (1 mês)

- [ ] Integração WhatsApp Business API
- [ ] Controle de caixa (abertura/fechamento)
- [ ] Multi-usuário com permissões
- [ ] App mobile (React Native)

### Longo Prazo (3+ meses)

- [ ] Integração com iFood/Rappi
- [ ] Sistema de fidelidade
- [ ] BI e Analytics avançado
- [ ] API pública REST

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário da **Fit DaLi**.

## 📞 Suporte

**Fit DaLi**  
📱 (35) 98832-3788  
📍 saudável com sabor!

---

Desenvolvido com ❤️ usando Next.js, Supabase e Kokonut UI
