# 🚀 Guia Rápido de Inicialização - Fit DaLi ERP

## Instalação Rápida (5 minutos)

### 1. Instalar Dependências
```bash
cd C:\Users\franc\Downloads\Software\fit-dali-erp
npm install
```

### 2. Configurar Supabase

#### Opção A: Usar Supabase Cloud (Recomendado)

1. Acesse https://supabase.com e crie uma conta gratuita
2. Crie um novo projeto (escolha uma senha forte)
3. Aguarde ~2 minutos para o projeto ser provisionado
4. Vá em **Settings > API**
5. Copie:
   - **Project URL** (parecido com `https://xxxxx.supabase.co`)
   - **anon/public key** (token longo começando com `eyJ...`)

6. Cole no arquivo `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...seu_token_aqui
```

7. No Supabase, vá em **SQL Editor** > **New Query**
8. Copie TODO o conteúdo de `supabase/schema.sql` e execute
9. Aguarde a confirmação "Success"

#### Opção B: Usar Supabase Local (Avançado)
```bash
npx supabase init
npx supabase start
npx supabase db reset
```

### 3. Criar Usuário Administrador

1. No Supabase Dashboard, vá em **Authentication > Users**
2. Clique em **Add user** > **Create new user**
3. Email: `admin@fitdali.com` (ou seu email)
4. Password: `SuaSenhaForte123!`
5. Clique em **Create user**

### 4. Iniciar o Servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

### 5. Primeiro Login

- Email: `admin@fitdali.com` (o que você criou)
- Senha: `SuaSenhaForte123!`

---

## 🎯 Checklist Pós-Instalação

- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] Criar primeira categoria (ex: "Fit")
- [ ] Criar primeiro produto
- [ ] Criar primeiro cliente
- [ ] Criar primeiro pedido
- [ ] Visualizar relatórios

---

## ⚡ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Produção
npm run build            # Gera build otimizado
npm start                # Inicia servidor de produção

# Qualidade
npm run lint             # Verifica erros no código
```

---

## 🐛 Problemas Comuns

### Erro: "Invalid API key"
- Verifique se copiou corretamente a `anon key` do Supabase
- Certifique-se que o arquivo `.env.local` está na raiz do projeto

### Erro: "relation does not exist"
- Execute novamente o script `schema.sql` no SQL Editor do Supabase
- Verifique se todas as tabelas foram criadas em **Database > Tables**

### Erro: "User not found" no login
- Crie um usuário em **Authentication > Users** no Supabase
- Use o mesmo email/senha que você cadastrou

### Página em branco após login
- Abra o Console do navegador (F12)
- Verifique se há erros de CORS ou autenticação
- Confirme que o middleware está configurado corretamente

---

## 📱 Próximos Passos

1. **Personalize as categorias** em Produtos
2. **Cadastre seus clientes** existentes
3. **Configure os preços** de acordo com seu negócio
4. **Teste o fluxo completo** de um pedido
5. **Explore os relatórios** para insights

---

## 🆘 Suporte

- 📞 WhatsApp: (35) 98832-3788
- 📧 Email: contato@fitdali.com
- 📚 Documentação: README.md

---

**Desenvolvido com ❤️ para Fit DaLi**
