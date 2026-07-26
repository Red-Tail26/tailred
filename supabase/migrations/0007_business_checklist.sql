-- Tracks progress on the "getting legit" checklist (LLC/EIN/bank
-- account/permits) — one row per user, an array of completed item keys.

create table business_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table business_checklist enable row level security;

create policy "Users manage their own checklist progress"
  on business_checklist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
