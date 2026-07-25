-- Tailred v1 schema: business profile, inventory, invoices.
-- Row Level Security is on for every table: a user may only ever
-- read or write rows where user_id = auth.uid().

create extension if not exists "pgcrypto";

create table business_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null,
  address text,
  phone text,
  website text,
  social_links text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null,
  cogs numeric(10, 2) not null default 0,
  list_price numeric(10, 2),
  platform text,
  status text not null default 'sourced'
    check (status in ('sourced', 'listed', 'sold')),
  sale_price numeric(10, 2),
  date_sold date,
  quantity_on_hand integer not null default 1,
  variant text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_name text not null,
  client_contact text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid')),
  date_sent date,
  date_paid date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  item_id uuid references inventory_items (id) on delete set null,
  description text,
  price numeric(10, 2) not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index inventory_items_user_id_idx on inventory_items (user_id);
create index invoices_user_id_idx on invoices (user_id);
create index invoice_items_invoice_id_idx on invoice_items (invoice_id);

-- Row Level Security

alter table business_profile enable row level security;
alter table inventory_items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "Users manage their own business profile"
  on business_profile for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own inventory"
  on inventory_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own invoices"
  on invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage line items on their own invoices"
  on invoice_items for all
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );
