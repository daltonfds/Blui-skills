# Blui

SaaS para transformar ideias em PRDs, arquitetura, roadmaps e prompts de implementação, além de revisão de segurança de código assistida por IA.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS
- Supabase Auth/Postgres/RLS
- Gemini API, chamada apenas no servidor
- Vercel para hosting

## Desenvolvimento
1. Copia `.env.example` para `.env.local`.
2. Preenche `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `GEMINI_API_KEY` no ambiente local e na Vercel.
3. Aplica a migração `supabase/migrations/202610120001_init.sql` no projeto Supabase correto.
4. Executa `npm install`, `npm run typecheck`, `npm run build`.

## System prompts
Os prompts oficiais e as regras de saída estão documentados em [docs/system-prompts.md](docs/system-prompts.md) e são usados pelo backend em `lib/prompts.ts`.

## Segurança e limitações
- O auditor é uma revisão assistida por IA; não executa o código nem substitui SAST/DAST.
- Não coloques segredos reais no auditor. O backend tenta redigir padrões comuns, mas não consegue garantir deteção de todos os segredos.
- Mantém chaves privadas no servidor. Nunca uses o prefixo `NEXT_PUBLIC_` em chaves privadas.
- Antes de produção, testa políticas RLS, autenticação, rate limits, abuso de créditos e recuperação de palavra-passe.
