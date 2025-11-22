# BancoSimples

Portal web de banco de questões para estudos de Medicina, feito com Next.js (App Router) e Supabase. Este guia explica como preparar a infraestrutura no Supabase e publicar no Netlify para ter o app online.

## Requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com/) com um projeto criado
- Conta no [Netlify](https://www.netlify.com/)

## Configuração do Supabase
1. **Aplicar o schema**
   - Abra o SQL Editor do Supabase e cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). Execute para criar tabelas e relações.

2. **Buckets do Storage**
   - Em *Storage* > *Buckets*, crie um bucket chamado `exports` com visibilidade *Public* (necessário para servir PDFs gerados).

3. **Configurações de Auth**
   - Em *Authentication* > *Settings*, confirme que o provedor de **Email** está habilitado.
   - Não há necessidade de templates customizados; o fluxo usa e-mail/senha simples.

4. **Chaves e URLs**
   - Em *Project Settings* > *API*, copie:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (usada apenas no endpoint de exportação de PDF). Mantenha-a segura e configure apenas no backend/Netlify.

## Variáveis de ambiente
Crie um arquivo `.env.local` na raiz com:

```
NEXT_PUBLIC_SUPABASE_URL=<sua-url-do-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
```

Para o deploy no Netlify, configure as mesmas variáveis no painel do site em **Site settings → Build & deploy → Environment**.

## Rodando localmente
```bash
npm install
npm run dev
```

- Acesse `http://localhost:3000` para testar.
- `npm run build` e `npm start` devem rodar antes do deploy para garantir que o bundle está saudável.

## Deploy no Netlify
1. **Importar repositório**
   - No Netlify, escolha *Add new site → Import an existing project* e conecte o repositório Git.
2. **Configurar build**
   - O projeto já inclui `netlify.toml` com:
     ```toml
     [build]
       command = "npm run build"
       publish = ".next"

     [[plugins]]
       package = "@netlify/plugin-nextjs"
     ```
3. **Variáveis de ambiente**
   - Adicione `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no painel do Netlify.
4. **Deploy**
   - Salve e dispare o build. Após publicar, o site já estará usando Supabase para Auth, banco e Storage.

## Fluxo de uso online
1. Acesse `/signup`, use o cupom **CONVIDADO** e cadastre e-mail/senha/nome.
2. Faça login em `/login`.
3. Crie cadernos em `/notebooks`, resolva-os em `/notebooks/[id]`, revise erros em `/review` e gere PDFs via endpoint `/api/export` (usado pelo botão de exportação).

## Dicas de operação
- Se trocar nomes de bucket ou tabelas, ajuste os trechos de código correspondentes em `app/api/export/route.js` e nas páginas de cadernos/questões.
- Para monitorar erros de produção, habilite logs no Netlify e no Supabase (SQL Editor → Logs).

