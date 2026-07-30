-- Operating expenses, separate from per-item cost of goods (already
-- tracked on inventory_items.cogs). This is the missing input for a
-- real P&L, and doubles as a tax write-off log — every category here
-- is a common deductible expense category for a small reseller/hustle.

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  category text not null
    check (category in (
      'listing_fees', 'shipping_supplies', 'subscriptions',
      'equipment', 'mileage_travel', 'marketing', 'other'
    )),
  amount numeric(10, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index expenses_user_id_idx on expenses (user_id);

alter table expenses enable row level security;

create policy "Users manage their own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
