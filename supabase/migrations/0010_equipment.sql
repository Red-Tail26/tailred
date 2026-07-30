-- Equipment tracker for service-based businesses (power washing, mobile
-- detailing, personal training, etc.) — these don't have resale
-- inventory (sourced/listed/sold with COGS vs. sale price), they have
-- durable equipment they own and use to deliver the service. Kept as
-- its own table rather than reusing inventory_items because the shape
-- is genuinely different: no status cycle, no sale price.

create table equipment_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  purchase_cost numeric(10, 2) not null default 0,
  purchase_date date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index equipment_items_user_id_idx on equipment_items (user_id);

alter table equipment_items enable row level security;

create policy "Users manage their own equipment"
  on equipment_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
