-- Plotverse Automation Studio V1 schema.
-- Run this in Supabase SQL editor when you want cloud persistence.

create table if not exists properties (
  id text primary key,
  title text not null,
  address text default '',
  area text not null,
  city text default 'Mumbai',
  property_type text default 'Apartment',
  price numeric default 0,
  size_sqft numeric default 0,
  bedrooms numeric default 0,
  bathrooms numeric default 0,
  status text default 'active',
  amenities text[] default '{}',
  notes text default '',
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clients (
  id text primary key,
  name text not null,
  contact text default '',
  budget_min numeric default 0,
  budget_max numeric default 0,
  preferred_areas text[] default '{}',
  property_type text default 'Apartment',
  min_bedrooms numeric default 0,
  min_size_sqft numeric default 0,
  must_haves text[] default '{}',
  deal_blockers text[] default '{}',
  urgency text default 'medium',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists matches (
  id text primary key,
  property_id text references properties(id) on delete cascade,
  client_id text references clients(id) on delete cascade,
  score numeric default 0,
  rule_result jsonb default '{}',
  fit_summary text default '',
  objections text[] default '{}',
  suggested_next_action text default '',
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists draft_messages (
  id text primary key,
  match_id text references matches(id) on delete cascade,
  channel text default 'whatsapp',
  tone text default 'warm',
  body text default '',
  edited_body text default '',
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists agent_modules (
  id text primary key,
  key text unique not null,
  label text not null,
  description text default '',
  input_schema text default '',
  output_schema text default '',
  prompt_summary text default '',
  x numeric default 0,
  y numeric default 0
);

create table if not exists agent_edges (
  id text primary key,
  source text not null,
  target text not null,
  label text default ''
);

create table if not exists agent_runs (
  id text primary key,
  workflow_key text not null,
  status text default 'queued',
  mode text default 'live',
  selected_property_ids text[] default '{}',
  selected_client_ids text[] default '{}',
  summary text default '',
  model text default '',
  token_usage jsonb default '{}',
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists agent_run_steps (
  id text primary key,
  run_id text references agent_runs(id) on delete cascade,
  module_key text not null,
  status text default 'completed',
  input jsonb default '{}',
  output jsonb default '{}',
  error text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists csv_imports (
  id text primary key,
  target text not null,
  filename text default '',
  rows_total numeric default 0,
  rows_imported numeric default 0,
  validation_errors text[] default '{}',
  status text default 'imported',
  created_at timestamptz default now()
);

alter table properties enable row level security;
alter table clients enable row level security;
alter table matches enable row level security;
alter table draft_messages enable row level security;
alter table agent_modules enable row level security;
alter table agent_edges enable row level security;
alter table agent_runs enable row level security;
alter table agent_run_steps enable row level security;
alter table csv_imports enable row level security;
