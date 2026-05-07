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
  land_details jsonb default '{}',
  source_url text,
  source_site text,
  scraped_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table properties add column if not exists land_details jsonb default '{}';
alter table properties add column if not exists source_url text;
alter table properties add column if not exists source_site text;
alter table properties add column if not exists scraped_at timestamptz;

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

create table if not exists scrape_sources (
  id text primary key,
  key text unique not null,
  name text not null,
  kind text default 'property',
  base_url text default '',
  search_url text default '',
  enabled boolean default true,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scrape_runs (
  id text primary key,
  scope text default '',
  status text default 'queued',
  source_ids text[] default '{}',
  items_found numeric default 0,
  items_imported numeric default 0,
  errors text[] default '{}',
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists scrape_items (
  id text primary key,
  run_id text references scrape_runs(id) on delete cascade,
  source_id text references scrape_sources(id) on delete set null,
  kind text default 'plot',
  status text default 'review',
  title text default '',
  locality text default '',
  district text default 'Kottayam',
  price numeric default 0,
  plot_area numeric default 0,
  area_unit text default 'unknown',
  plot_area_sqft numeric default 0,
  price_per_cent numeric default 0,
  source_url text default '',
  source_site text default '',
  raw_text text default '',
  contact_name text default '',
  visible_contact text default '',
  lead_type text default 'unknown',
  requirement_text text default '',
  preferred_areas text[] default '{}',
  budget_min numeric default 0,
  budget_max numeric default 0,
  purpose text default '',
  confidence numeric default 0,
  duplicate_of text,
  normalized jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists token_usage_events (
  id text primary key,
  action_type text not null,
  action_label text default '',
  model text not null,
  input_tokens numeric default 0,
  cached_input_tokens numeric default 0,
  output_tokens numeric default 0,
  reasoning_tokens numeric default 0,
  total_tokens numeric default 0,
  input_cost_usd numeric default 0,
  output_cost_usd numeric default 0,
  total_cost_usd numeric default 0,
  pricing_source text default '',
  related_run_id text,
  related_entity_id text,
  metadata jsonb default '{}',
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
alter table scrape_sources enable row level security;
alter table scrape_runs enable row level security;
alter table scrape_items enable row level security;
alter table token_usage_events enable row level security;
