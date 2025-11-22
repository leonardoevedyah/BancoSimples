-- Schema para Banco de Questões
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists users_profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  subject text,
  topic text,
  statement text not null,
  options text[] not null,
  correct_option integer not null,
  explanation text,
  difficulty text,
  created_at timestamptz default now()
);

create table if not exists notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_profiles(id),
  title text not null,
  filters jsonb,
  created_at timestamptz default now()
);

create table if not exists notebook_questions (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references notebooks(id),
  question_id uuid not null references questions(id),
  order_index integer not null,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  notebook_id uuid not null,
  total_questions integer not null,
  correct_count integer not null,
  wrong_count integer not null,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists question_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null,
  question_id uuid not null,
  selected_option integer,
  is_correct boolean,
  created_at timestamptz default now()
);
