-- Persists the budget calculator so it's not lost every time you leave
-- the page, and so the dashboard can show your breakeven numbers.

create table budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  startup_costs jsonb not null default '[]'::jsonb,
  monthly_burn jsonb not null default '[]'::jsonb,
  monthly_revenue numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table budget_plans enable row level security;

create policy "Users manage their own budget plan"
  on budget_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
