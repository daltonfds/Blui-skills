alter table public.academic_generations drop constraint if exists academic_generations_mode_check;
alter table public.academic_generations
  add constraint academic_generations_mode_check check (mode in ('research','paper','study'));

create or replace function public.create_academic_generation(
  p_mode text, p_title text, p_input_data jsonb, p_output_data jsonb, p_cards jsonb default '[]'::jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_generation uuid; v_card jsonb;
begin
  if v_user is null then raise exception 'not authorized'; end if;
  if p_mode not in ('research','paper','study') then raise exception 'invalid mode'; end if;
  update public.profiles set credits = credits - 1 where id = v_user and credits > 0;
  if not found then raise exception 'insufficient credits'; end if;
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
end; $$;
revoke all on function public.create_academic_generation(text,text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.create_academic_generation(text,text,jsonb,jsonb,jsonb) to authenticated;
