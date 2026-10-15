-- Paid access passes and server-side credit enforcement.
-- A pass grants access until pass_expires_at; expired passes fall back to credits.

alter table public.profiles
  add column if not exists plan_type text not null default 'free',
  add column if not exists pass_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_plan_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_type_check
      check (plan_type in ('free','daily_pass','weekly_pass','monthly_pass'));
  end if;
end $$;

alter table public.profiles alter column plan_type set default 'free';
alter table public.profiles alter column credits set default 0;

create index if not exists profiles_pass_expiry_idx
  on public.profiles (pass_expires_at)
  where pass_expires_at is not null;

create or replace function public.create_roadmap_project(
  p_title text, p_description text, p_tech_stack text,
  p_prd_architecture jsonb, p_roadmap_steps jsonb, p_master_prompt text
) returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid;
  v_has_pass boolean := false;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select (plan_type in ('daily_pass','weekly_pass','monthly_pass')
    and pass_expires_at is not null and pass_expires_at > now())
    into v_has_pass
  from public.profiles where id = v_user_id;

  if coalesce(v_has_pass, false) = false then
    update public.profiles set credits = credits - 1, updated_at = now()
    where id = v_user_id and credits > 0;
    if not found then raise exception 'Insufficient credits'; end if;
  end if;

  insert into public.projects (
    user_id, title, description, tech_stack, roadmap,
    prd_architecture, roadmap_steps, master_prompt
  ) values (
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
  ) returning id into v_project_id;
  return v_project_id;
end;
$function$;

create or replace function public.create_academic_generation(
  p_mode text, p_title text, p_input_data jsonb,
  p_output_data jsonb, p_cards jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_generation uuid;
  v_card jsonb;
  v_has_pass boolean := false;
begin
  if v_user is null then raise exception 'not authorized'; end if;
  if p_mode not in ('research','paper','study') then raise exception 'invalid mode'; end if;

  select (plan_type in ('daily_pass','weekly_pass','monthly_pass')
    and pass_expires_at is not null and pass_expires_at > now())
    into v_has_pass
  from public.profiles where id = v_user;

  if coalesce(v_has_pass, false) = false then
    update public.profiles set credits = credits - 1, updated_at = now()
    where id = v_user and credits > 0;
    if not found then raise exception 'insufficient credits'; end if;
  end if;

  insert into public.academic_generations(user_id, mode, title, input_data, output_data)
    values(v_user, p_mode, left(coalesce(nullif(trim(p_title),''),'Academic study'),160), coalesce(p_input_data,'{}'::jsonb), p_output_data)
    returning id into v_generation;

  if p_mode = 'study' and jsonb_typeof(p_cards) = 'array' then
    for v_card in select value from jsonb_array_elements(p_cards) loop
      insert into public.academic_study_cards(user_id,generation_id,topic,question,answer,options,card_type,due_at)
      values(v_user,v_generation,left(coalesce(v_card->>'topic','General review'),160),
        left(coalesce(v_card->>'question',''),2000),left(coalesce(v_card->>'answer',''),5000),
        case when jsonb_typeof(v_card->'options')='array' then v_card->'options' else '[]'::jsonb end,
        case when v_card->>'type' in ('flashcard','multiple_choice','open_question') then v_card->>'type' else 'flashcard' end,
        now() + interval '1 day');
    end loop;
  end if;
  return v_generation;
end;
$function$;

revoke all on function public.create_roadmap_project(text,text,text,jsonb,jsonb,text) from public, anon;
grant execute on function public.create_roadmap_project(text,text,text,jsonb,jsonb,text) to authenticated;
revoke all on function public.create_academic_generation(text,text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.create_academic_generation(text,text,jsonb,jsonb,jsonb) to authenticated;
