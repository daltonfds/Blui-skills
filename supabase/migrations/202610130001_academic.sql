-- Blui Academic: user-scoped work history, flashcards and atomic credit usage.
create table if not exists public.academic_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('paper','study')),
  title text not null,
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists academic_generations_user_created_idx on public.academic_generations(user_id, created_at desc);
create table if not exists public.academic_study_cards (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.academic_generations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null default 'Revisão',
  question text not null,
  answer text not null,
  options jsonb not null default '[]'::jsonb,
  card_type text not null default 'flashcard',
  interval_step integer not null default 0 check (interval_step between 0 and 4),
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists academic_cards_due_idx on public.academic_study_cards(user_id, due_at);
alter table public.academic_generations enable row level security;
alter table public.academic_study_cards enable row level security;
drop policy if exists "academic generation owner read" on public.academic_generations;
create policy "academic generation owner read" on public.academic_generations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "academic card owner read" on public.academic_study_cards;
create policy "academic card owner read" on public.academic_study_cards for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.academic_generations, public.academic_study_cards to authenticated;

create or replace function public.create_academic_generation(
  p_mode text, p_title text, p_input_data jsonb, p_output_data jsonb, p_cards jsonb default '[]'::jsonb
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := (select auth.uid()); v_generation uuid; v_card jsonb;
begin
  if v_user is null then raise exception 'not authorized'; end if;
  if p_mode not in ('paper','study') then raise exception 'invalid mode'; end if;
  if p_output_data is null or jsonb_typeof(p_output_data) <> 'object' then raise exception 'invalid output'; end if;
  if p_mode = 'paper' and length(coalesce(p_output_data->>'content','')) < 300 then raise exception 'invalid output'; end if;
  update public.profiles set credits = credits - 1 where id = v_user and credits > 0;
  if not found then raise exception 'insufficient credits'; end if;
  insert into public.academic_generations(user_id,mode,title,input_data,output_data)
  values(v_user,p_mode,left(coalesce(nullif(trim(p_title),''),'Academic work'),160),coalesce(p_input_data,'{}'::jsonb),p_output_data)
  returning id into v_generation;
  if p_mode = 'study' and jsonb_typeof(p_cards) = 'array' then
    for v_card in select value from jsonb_array_elements(p_cards) loop
      if jsonb_typeof(v_card) = 'object' and length(coalesce(v_card->>'question','')) > 0 and length(coalesce(v_card->>'answer','')) > 0 then
        insert into public.academic_study_cards(generation_id,user_id,topic,question,answer,options,card_type,due_at)
        values(v_generation,v_user,left(coalesce(v_card->>'topic','Revisão'),160),left(v_card->>'question',2000),left(v_card->>'answer',5000),
          case when jsonb_typeof(v_card->'options') = 'array' then v_card->'options' else '[]'::jsonb end,
          left(coalesce(v_card->>'type','flashcard'),40), now() + interval '1 day');
      end if;
    end loop;
  end if;
  return v_generation;
end; $$;
revoke all on function public.create_academic_generation(text,text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.create_academic_generation(text,text,jsonb,jsonb,jsonb) to authenticated;

create or replace function public.review_academic_card(p_card_id uuid, p_result text)
returns timestamptz language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := (select auth.uid()); v_step integer; v_days integer; v_due timestamptz;
begin
  if v_user is null then raise exception 'not authorized'; end if;
  if p_result not in ('again','hard','good','easy') then raise exception 'invalid result'; end if;
  select interval_step into v_step from public.academic_study_cards where id=p_card_id and user_id=v_user for update;
  if not found then raise exception 'card not found'; end if;
  if p_result='again' then v_step:=0; v_days:=1;
  elsif p_result='hard' then v_step:=least(v_step+1,2); v_days:=3;
  elsif p_result='good' then v_step:=least(v_step+1,3); v_days:=7;
  else v_step:=4; v_days:=14;
  end if;
  v_due:=now() + make_interval(days => v_days);
  update public.academic_study_cards set interval_step=v_step,due_at=v_due where id=p_card_id and user_id=v_user;
  return v_due;
end; $$;
revoke all on function public.review_academic_card(uuid,text) from public, anon;
grant execute on function public.review_academic_card(uuid,text) to authenticated;
