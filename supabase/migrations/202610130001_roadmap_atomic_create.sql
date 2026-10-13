-- Add structured roadmap fields and atomically charge one credit per saved generation.
alter table public.projects
  add column if not exists prd_architecture jsonb not null default '{}'::jsonb,
  add column if not exists roadmap_steps jsonb not null default '[]'::jsonb;

create or replace function public.create_roadmap_project(
  p_title text,
  p_description text,
  p_tech_stack text,
  p_prd_architecture jsonb,
  p_roadmap_steps jsonb,
  p_master_prompt text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
     set credits = credits - 1
   where id = v_user_id
     and credits > 0;

  if not found then
    raise exception 'Insufficient credits';
  end if;

  insert into public.projects (
    user_id, title, description, tech_stack, roadmap,
    prd_architecture, roadmap_steps, master_prompt
  )
  values (
    v_user_id,
    coalesce(nullif(left(trim(p_title), 120), ''), 'New project'),
    coalesce(p_description, ''),
    jsonb_build_object('value', coalesce(p_tech_stack, 'Custom')),
    jsonb_build_object(
      'projectName', coalesce(p_title, 'New project'),
      'prd', coalesce(p_prd_architecture ->> 'prd', ''),
      'architecture', coalesce(p_prd_architecture ->> 'architecture', ''),
      'roadmap', coalesce(p_roadmap_steps, '[]'::jsonb),
      'masterPrompt', coalesce(p_master_prompt, '')
    ),
    coalesce(p_prd_architecture, '{}'::jsonb),
    coalesce(p_roadmap_steps, '[]'::jsonb),
    coalesce(p_master_prompt, '')
  )
  returning id into v_project_id;

  return v_project_id;
end;
$$;

revoke all on function public.create_roadmap_project(text, text, text, jsonb, jsonb, text) from public, anon;
grant execute on function public.create_roadmap_project(text, text, text, jsonb, jsonb, text) to authenticated;
