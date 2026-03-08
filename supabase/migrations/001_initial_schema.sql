-- ══════════════════════════════════════════
--  Iron Berserk — Migration 001
--  Ejecutar en: Supabase > SQL Editor
-- ══════════════════════════════════════════

-- ── PROFILES ─────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  streak       int default 0,
  created_at   timestamptz default now()
);

-- Crear perfil automáticamente al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── EXERCISES ────────────────────────────
create table if not exists exercises (
  id               bigint primary key generated always as identity,
  name             text not null,
  muscle_group     text not null,
  secondary_muscles text[],
  equipment        text,
  is_custom        boolean default false,
  created_by       uuid references profiles(id),
  created_at       timestamptz default now()
);

-- Índice para búsqueda por nombre
create index if not exists idx_exercises_name on exercises using gin(to_tsvector('english', name));
create index if not exists idx_exercises_muscle on exercises(muscle_group);

-- ── RUTINAS ──────────────────────────────
create table if not exists routines (
  id                bigint primary key generated always as identity,
  author_id         uuid not null references profiles(id) on delete cascade,
  name              text not null,
  description       text,
  days_per_week     int,
  is_public         boolean default false,
  tags              text[],
  subscribers_count int default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_routines_public     on routines(is_public, subscribers_count desc);
create index if not exists idx_routines_author     on routines(author_id);
create index if not exists idx_routines_tags       on routines using gin(tags);

-- Auto-update updated_at
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger routines_updated_at
  before update on routines
  for each row execute procedure touch_updated_at();

-- ── ROUTINE EXERCISES ─────────────────────
create table if not exists routine_exercises (
  id             bigint primary key generated always as identity,
  routine_id     bigint not null references routines(id) on delete cascade,
  exercise_id    bigint not null references exercises(id),
  day_number     int not null,
  position       int not null,
  target_sets    int not null default 3,
  target_reps    int,
  target_weight  numeric,
  notes          text
);

create index if not exists idx_routine_exercises_routine on routine_exercises(routine_id, day_number, position);

-- ── SUSCRIPCIONES ────────────────────────
create table if not exists routine_subscriptions (
  id            bigint primary key generated always as identity,
  user_id       uuid not null references profiles(id) on delete cascade,
  routine_id    bigint not null references routines(id) on delete cascade,
  subscribed_at timestamptz default now(),
  unique (user_id, routine_id)
);

-- Trigger para mantener subscribers_count actualizado
create or replace function update_subscribers_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update routines set subscribers_count = subscribers_count + 1
    where id = NEW.routine_id;
  elsif TG_OP = 'DELETE' then
    update routines set subscribers_count = greatest(subscribers_count - 1, 0)
    where id = OLD.routine_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_subscribers_count
  after insert or delete on routine_subscriptions
  for each row execute function update_subscribers_count();

-- ── WORKOUT SESSIONS ─────────────────────
create table if not exists workout_sessions (
  id           bigint primary key generated always as identity,
  user_id      uuid not null references profiles(id) on delete cascade,
  routine_id   bigint references routines(id),
  name         text,
  started_at   timestamptz default now(),
  finished_at  timestamptz,
  notes        text,
  total_volume numeric default 0
);

create index if not exists idx_sessions_user on workout_sessions(user_id, started_at desc);

-- ── WORKOUT SETS ─────────────────────────
create table if not exists workout_sets (
  id          bigint primary key generated always as identity,
  session_id  bigint not null references workout_sessions(id) on delete cascade,
  exercise_id bigint not null references exercises(id),
  set_number  int not null,
  weight_kg   numeric,
  reps        int,
  rpe         numeric check (rpe between 1 and 10),
  completed   boolean default false,
  logged_at   timestamptz default now()
);

create index if not exists idx_sets_session on workout_sets(session_id);

-- ══════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ══════════════════════════════════════════

alter table profiles             enable row level security;
alter table exercises            enable row level security;
alter table routines             enable row level security;
alter table routine_exercises    enable row level security;
alter table routine_subscriptions enable row level security;
alter table workout_sessions     enable row level security;
alter table workout_sets         enable row level security;

-- Profiles
create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_own"         on profiles for all    using (auth.uid() = id);

-- Exercises (globales son públicas, custom solo del owner)
create policy "exercises_select"     on exercises for select using (is_custom = false or created_by = auth.uid());
create policy "exercises_insert"     on exercises for insert with check (created_by = auth.uid());
create policy "exercises_own"        on exercises for all    using (created_by = auth.uid());

-- Routines
create policy "routines_select"      on routines for select using (is_public = true or author_id = auth.uid());
create policy "routines_own"         on routines for all    using (author_id = auth.uid());

-- Routine exercises (se ven si se puede ver la rutina)
create policy "routine_exercises_select" on routine_exercises for select
  using (routine_id in (select id from routines where is_public = true or author_id = auth.uid()));
create policy "routine_exercises_own"    on routine_exercises for all
  using (routine_id in (select id from routines where author_id = auth.uid()));

-- Subscriptions
create policy "subs_select"  on routine_subscriptions for select using (user_id = auth.uid());
create policy "subs_own"     on routine_subscriptions for all    using (user_id = auth.uid());

-- Sessions
create policy "sessions_own" on workout_sessions for all using (user_id = auth.uid());

-- Sets (acceso a través de la sesión)
create policy "sets_own" on workout_sets for all
  using (session_id in (select id from workout_sessions where user_id = auth.uid()));

-- ══════════════════════════════════════════
--  SEED — Ejercicios globales base
-- ══════════════════════════════════════════

insert into exercises (name, muscle_group, secondary_muscles, equipment, is_custom) values
  ('Bench Press',         'chest',     array['triceps','shoulders'], 'barbell',    false),
  ('Incline Bench Press', 'chest',     array['triceps','shoulders'], 'barbell',    false),
  ('Dumbbell Fly',        'chest',     array['shoulders'],           'dumbbell',   false),
  ('Cable Crossover',     'chest',     array['shoulders'],           'cable',      false),
  ('Pull-Up',             'back',      array['biceps'],              'bodyweight', false),
  ('Barbell Row',         'back',      array['biceps','rear_delt'],  'barbell',    false),
  ('Lat Pulldown',        'back',      array['biceps'],              'cable',      false),
  ('Deadlift',            'back',      array['glutes','hamstrings'], 'barbell',    false),
  ('Overhead Press',      'shoulders', array['triceps'],             'barbell',    false),
  ('Lateral Raise',       'shoulders', array[],                      'dumbbell',   false),
  ('Squat',               'legs',      array['glutes','hamstrings'], 'barbell',    false),
  ('Romanian Deadlift',   'legs',      array['glutes'],              'barbell',    false),
  ('Leg Press',           'legs',      array['glutes'],              'machine',    false),
  ('Barbell Curl',        'biceps',    array['forearms'],            'barbell',    false),
  ('Tricep Pushdown',     'triceps',   array[],                      'cable',      false),
  ('Weighted Dips',       'triceps',   array['chest','shoulders'],   'bodyweight', false)
on conflict do nothing;
