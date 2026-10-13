-- Blui Docs: persist generated documents and atomically charge one credit.
create table if not exists public.docs_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_name text not null default 'Untitled project',
  documents jsonb not null,
  source_files text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists docs_generations_user_created_idx
  on public.docs_generations(user_id, created_at desc);

alter table public.docs_generations enable row level security;

drop policy if exists "Docs generations can be read by owner" on public.docs_generations;
create policy "Docs generations can be read by owner"
  on public.docs_generations for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Docs generations can be deleted by owner" on public.docs_generations;
create policy "Docs generations can be deleted by owner"
  on public.docs_generations for delete to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update on public.docs_generations from authenticated;
grant select, delete on public.docs_generations to authenticated;

create or replace function public.create_docs_generation(
  p_project_name text,
  p_documents jsonb,
  p_source_files text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_doc_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_documents is null
    or jsonb_typeof(p_documents) <> 'object'
    or coalesce(p_documents ->> 'readme', '') = ''
    or coalesce(p_documents ->> 'dataDictionary', '') = ''
    or coalesce(p_documents ->> 'apiReference', '') = ''
    or coalesce(p_documents ->> 'contextPrompt', '') = '' then
    raise exception 'Invalid documentation payload';
  end if;

  update public.profiles
     set credits = credits - 1, updated_at = now()
   where id = v_user_id and credits > 0;

  if not found then
    raise exception 'Insufficient credits';
  end if;

  insert into public.docs_generations(user_id, project_name, documents, source_files)
  values (
    v_user_id,
    coalesce(nullif(left(trim(p_project_name), 120), ''), 'Untitled project'),
    p_documents,
    coalesce(p_source_files, '{}'::text[])
  )
  returning id into v_doc_id;

  return v_doc_id;
end;
$$;

revoke all on function public.create_docs_generation(text, jsonb, text[]) from public, anon;
grant execute on function public.create_docs_generation(text, jsonb, text[]) to authenticated;
