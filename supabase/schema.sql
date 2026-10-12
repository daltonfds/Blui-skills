-- BluiSkill initial schema. Apply in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  credits integer not null default 10 check (credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  tech_stack jsonb not null default '{}'::jsonb,
  roadmap jsonb not null default '{}'::jsonb,
  master_prompt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_audits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  audit_type text not null default 'snippet' check (audit_type in ('snippet', 'github_repo', 'live_url')),
  target_name text,
  code_snippet text,
  vulnerabilities_found jsonb not null default '[]'::jsonb,
  fix_prompt text not null default '',
  risk_score text not null default 'MEDIUM' check (risk_score in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE')),
  created_at timestamptz not null default now()
);

-- Make the script safe to apply over the earlier BluiSkill schema as well.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists credits integer not null default 10;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.projects add column if not exists title text not null default 'Untitled project';
alter table public.projects add column if not exists description text not null default '';
alter table public.projects add column if not exists tech_stack jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists roadmap jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists master_prompt text not null default '';
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();

alter table public.security_audits add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.security_audits add column if not exists audit_type text not null default 'snippet';
alter table public.security_audits add column if not exists target_name text;
alter table public.security_audits add column if not exists code_snippet text;
alter table public.security_audits alter column code_snippet drop not null;
alter table public.security_audits add column if not exists vulnerabilities_found jsonb not null default '[]'::jsonb;
alter table public.security_audits add column if not exists fix_prompt text not null default '';
alter table public.security_audits add column if not exists risk_score text not null default 'MEDIUM';
alter table public.security_audits add column if not exists created_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro'));
alter table public.security_audits drop constraint if exists security_audits_audit_type_check;
alter table public.security_audits add constraint security_audits_audit_type_check check (audit_type in ('snippet', 'github_repo', 'live_url'));
alter table public.security_audits drop constraint if exists security_audits_risk_score_check;
alter table public.security_audits add constraint security_audits_risk_score_check check (risk_score in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE'));

create index if not exists projects_user_created_idx on public.projects(user_id, created_at desc);
create index if not exists security_audits_user_created_idx on public.security_audits(user_id, created_at desc);
create index if not exists security_audits_project_idx on public.security_audits(project_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.security_audits enable row level security;

-- Prevent users from changing their own plan or credit balance through the Data API.
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Remove equivalent legacy policies to avoid duplicate permissive policy evaluation.
drop policy if exists "profile owner can read" on public.profiles;
drop policy if exists "project owner can read" on public.projects;
drop policy if exists "project owner can insert" on public.projects;
drop policy if exists "project owner can update" on public.projects;
drop policy if exists "project owner can delete" on public.projects;
drop policy if exists "audit owner can read" on public.security_audits;
drop policy if exists "audit owner can insert" on public.security_audits;

drop policy if exists "Profiles can be read by owner" on public.profiles;
create policy "Profiles can be read by owner" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Profiles can be updated by owner" on public.profiles;
create policy "Profiles can be updated by owner" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Projects are managed by owner" on public.projects;
create policy "Projects are managed by owner" on public.projects for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Audits can be read by owner" on public.security_audits;
create policy "Audits can be read by owner" on public.security_audits for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Audits can be inserted by owner" on public.security_audits;
create policy "Audits can be inserted by owner" on public.security_audits for insert to authenticated with check (user_id = (select auth.uid()) and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))));
drop policy if exists "Audits can be deleted by owner" on public.security_audits;
create policy "Audits can be deleted by owner" on public.security_audits for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.sync_user_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated after update of email on auth.users
for each row execute procedure public.sync_user_email();

-- Atomic credit deduction. Users may only spend their own credits.
create or replace function public.consume_blui_credit(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized to consume these credits';
  end if;
  update public.profiles
     set credits = credits - 1, updated_at = now()
   where id = p_user_id and credits > 0;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.consume_blui_credit(uuid) from public;
grant execute on function public.consume_blui_credit(uuid) to authenticated;
