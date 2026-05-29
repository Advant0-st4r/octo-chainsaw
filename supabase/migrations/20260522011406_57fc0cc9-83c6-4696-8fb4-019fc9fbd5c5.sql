
-- Extensions
create extension if not exists vector;

-- Enums
create type public.cog_time_type as enum ('high','low','latent','lever');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- updated_at trigger fn
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Goals
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  success_metrics text,
  deliverables text,
  constraints text,
  horizon text,
  context text,
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "goals owner all" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index goals_user_idx on public.goals(user_id, created_at desc);

-- Execution maps
create table public.execution_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  summary text,
  leverage_rationale text,
  cds_estimate numeric,
  ltf_estimate numeric,
  re_ramp_protocol text,
  scalability_mechanism text,
  model text,
  created_at timestamptz not null default now()
);
alter table public.execution_maps enable row level security;
create policy "maps owner all" on public.execution_maps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index maps_user_idx on public.execution_maps(user_id, created_at desc);

-- Phases
create table public.phases (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.execution_maps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ord int not null,
  name text not null,
  session_type public.cog_time_type not null,
  duration_minutes int,
  cds_contribution numeric,
  leverage_multiplier numeric,
  description text,
  actions jsonb not null default '[]'::jsonb,
  unlocks jsonb not null default '[]'::jsonb,
  compounding_mechanism text,
  cognitive_waste_risk text
);
alter table public.phases enable row level security;
create policy "phases owner all" on public.phases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index phases_map_idx on public.phases(map_id, ord);

-- Principles
create table public.principles (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.execution_maps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ord int not null,
  text text not null
);
alter table public.principles enable row level security;
create policy "principles owner all" on public.principles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index principles_map_idx on public.principles(map_id, ord);

-- Waste risks
create table public.waste_risks (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.execution_maps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ord int not null,
  text text not null
);
alter table public.waste_risks enable row level security;
create policy "risks owner all" on public.waste_risks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index risks_map_idx on public.waste_risks(map_id, ord);

-- Session ledger (append-only by convention; no update/delete policies)
create table public.session_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_id uuid references public.execution_maps(id) on delete set null,
  phase_id uuid references public.phases(id) on delete set null,
  session_label text,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  duration_s int generated always as (extract(epoch from (end_ts - start_ts))::int) stored,
  time_type public.cog_time_type not null,
  density_score numeric,
  derivation_source text,
  blocked_flag boolean not null default false,
  leveraged_flag boolean not null default false,
  context_switch_count int not null default 0,
  re_ramp_minutes numeric not null default 0,
  downstream_unlocks jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.session_events enable row level security;
create policy "events owner select" on public.session_events for select using (auth.uid() = user_id);
create policy "events owner insert" on public.session_events for insert with check (auth.uid() = user_id);
create index events_user_time_idx on public.session_events(user_id, start_ts desc);

-- RAG chunks
create table public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,           -- 'map_summary' | 'phase'
  source_id uuid not null,             -- map_id or phase id
  map_id uuid not null references public.execution_maps(id) on delete cascade,
  chunk_ord int not null default 0,
  content text not null,
  embedding vector(1536) not null,
  token_count int,
  created_at timestamptz not null default now()
);
alter table public.rag_chunks enable row level security;
create policy "rag owner all" on public.rag_chunks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index rag_user_idx on public.rag_chunks(user_id);
create index rag_embed_idx on public.rag_chunks using hnsw (embedding vector_cosine_ops);

-- Match function: scoped to caller via auth.uid()
create or replace function public.match_user_chunks(
  query_embedding vector(1536),
  match_count int default 6,
  min_similarity float default 0.25
)
returns table (
  id uuid,
  map_id uuid,
  source_type text,
  content text,
  similarity float
)
language sql stable security invoker set search_path = public as $$
  select c.id, c.map_id, c.source_type, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.rag_chunks c
  where c.user_id = auth.uid()
    and 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Usage counters (hourly rate limit)
create table public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  kind text not null,
  count int not null default 0,
  primary key (user_id, window_start, kind)
);
alter table public.usage_counters enable row level security;
create policy "usage owner all" on public.usage_counters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
