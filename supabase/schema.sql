create extension if not exists pgcrypto;

drop table if exists public.topic_comments cascade;
drop table if exists public.topics cascade;
drop table if exists public.content_comments cascade;
drop table if exists public.course_contents cascade;
drop table if exists public.signups cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id text primary key,
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar text not null check (avatar in ('seed', 'lamp', 'book', 'moon', 'compass', 'spark')),
  edit_code text not null check (edit_code ~ '^[A-Za-z0-9]{4,8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signups (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.profiles(id) on delete cascade,
  nickname text not null,
  avatar text not null check (avatar in ('seed', 'lamp', 'book', 'moon', 'compass', 'spark')),
  days text[] not null default '{}',
  question text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

create table public.course_contents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('tool', 'method', 'case')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_comments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.course_contents(id) on delete cascade,
  profile_id text not null references public.profiles(id) on delete cascade,
  nickname text not null,
  avatar text not null check (avatar in ('seed', 'lamp', 'book', 'moon', 'compass', 'spark')),
  body text not null check (char_length(body) between 1 and 800),
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.profiles(id) on delete cascade,
  nickname text not null,
  avatar text not null check (avatar in ('seed', 'lamp', 'book', 'moon', 'compass', 'spark')),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1200),
  category text not null check (category in ('controversy', 'learning', 'relationship', 'career', 'other')),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.topic_comments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  profile_id text not null references public.profiles(id) on delete cascade,
  nickname text not null,
  avatar text not null check (avatar in ('seed', 'lamp', 'book', 'moon', 'compass', 'spark')),
  body text not null check (char_length(body) between 1 and 800),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger signups_touch_updated_at
before update on public.signups
for each row execute function public.touch_updated_at();

create trigger course_contents_touch_updated_at
before update on public.course_contents
for each row execute function public.touch_updated_at();

create or replace function public.profile_exists(p_profile_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = p_profile_id);
$$;

create or replace function public.update_profile_with_code(
  p_profile_id text,
  p_edit_code text,
  p_nickname text,
  p_avatar text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set nickname = left(p_nickname, 24),
      avatar = p_avatar
  where id = p_profile_id
    and edit_code = p_edit_code
    and p_avatar in ('seed', 'lamp', 'book', 'moon', 'compass', 'spark');

  if not found then
    raise exception 'Invalid edit code or profile.';
  end if;
end;
$$;

create or replace function public.upsert_signup_with_code(
  p_profile_id text,
  p_edit_code text,
  p_nickname text,
  p_avatar text,
  p_days text[],
  p_question text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(select 1 from public.profiles where id = p_profile_id and edit_code = p_edit_code) then
    raise exception 'Invalid edit code or profile.';
  end if;

  insert into public.signups(profile_id, nickname, avatar, days, question)
  values (
    p_profile_id,
    left(p_nickname, 24),
    p_avatar,
    p_days,
    nullif(left(coalesce(p_question, ''), 500), '')
  )
  on conflict (profile_id) do update
  set nickname = excluded.nickname,
      avatar = excluded.avatar,
      days = excluded.days,
      question = excluded.question;
end;
$$;

create or replace function public.add_content_comment_with_code(
  p_profile_id text,
  p_edit_code text,
  p_content_id uuid,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = p_profile_id and edit_code = p_edit_code;
  if not found then
    raise exception 'Invalid edit code or profile.';
  end if;

  insert into public.content_comments(content_id, profile_id, nickname, avatar, body)
  values (p_content_id, p.id, p.nickname, p.avatar, left(p_body, 800));
end;
$$;

create or replace function public.create_topic_with_code(
  p_profile_id text,
  p_edit_code text,
  p_title text,
  p_body text,
  p_category text,
  p_is_anonymous boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = p_profile_id and edit_code = p_edit_code;
  if not found then
    raise exception 'Invalid edit code or profile.';
  end if;

  if p_category not in ('controversy', 'learning', 'relationship', 'career', 'other') then
    raise exception 'Invalid category.';
  end if;

  insert into public.topics(profile_id, nickname, avatar, title, body, category, is_anonymous)
  values (p.id, p.nickname, p.avatar, left(p_title, 80), left(p_body, 1200), p_category, coalesce(p_is_anonymous, false));
end;
$$;

create or replace function public.add_topic_comment_with_code(
  p_profile_id text,
  p_edit_code text,
  p_topic_id uuid,
  p_body text,
  p_is_anonymous boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = p_profile_id and edit_code = p_edit_code;
  if not found then
    raise exception 'Invalid edit code or profile.';
  end if;

  insert into public.topic_comments(topic_id, profile_id, nickname, avatar, body, is_anonymous)
  values (p_topic_id, p.id, p.nickname, p.avatar, left(p_body, 800), coalesce(p_is_anonymous, false));
end;
$$;

alter table public.profiles enable row level security;
alter table public.signups enable row level security;
alter table public.course_contents enable row level security;
alter table public.content_comments enable row level security;
alter table public.topics enable row level security;
alter table public.topic_comments enable row level security;

create policy profiles_insert_anon
on public.profiles for insert
to anon
with check (true);

create policy signups_select_anon
on public.signups for select
to anon
using (true);

create policy course_contents_select_anon
on public.course_contents for select
to anon
using (true);

create policy content_comments_select_anon
on public.content_comments for select
to anon
using (true);

create policy topics_select_anon
on public.topics for select
to anon
using (true);

create policy topic_comments_select_anon
on public.topic_comments for select
to anon
using (true);

grant usage on schema public to anon;
grant insert on public.profiles to anon;
grant select on public.signups, public.course_contents, public.content_comments, public.topics, public.topic_comments to anon;
grant execute on function public.update_profile_with_code(text, text, text, text) to anon;
grant execute on function public.upsert_signup_with_code(text, text, text, text, text[], text) to anon;
grant execute on function public.profile_exists(text) to anon;
grant execute on function public.add_content_comment_with_code(text, text, uuid, text) to anon;
grant execute on function public.create_topic_with_code(text, text, text, text, text, boolean) to anon;
grant execute on function public.add_topic_comment_with_code(text, text, uuid, text, boolean) to anon;
