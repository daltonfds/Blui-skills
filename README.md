# Blui
SaaS para planear aplicações com IA e rever código à procura de riscos de segurança.

## Stack
Next.js App Router, TypeScript, Tailwind CSS v4, Supabase Auth/PostgreSQL/RLS e Google Gemini API.

## Configuração
1. Copie `.env.example` para `.env.local` e preencha as variáveis.
2. Execute `npm install` e `npm run dev`.
3. Aplique `supabase/migrations/202610120001_init.sql` ao projeto Supabase correto.

A chave Gemini é apenas do servidor. Nunca use `NEXT_PUBLIC_` para chaves secretas. A auditoria por IA não substitui ferramentas SAST/DAST nem revisão profissional.
