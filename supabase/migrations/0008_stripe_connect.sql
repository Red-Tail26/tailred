-- Stripe Connect (Express) fields. Money never touches Tailred's own
-- account — transfer_data.destination on the checkout session sends
-- funds straight to the operator's connected account, minus our
-- application fee.

alter table business_profile
  add column stripe_account_id text,
  add column stripe_charges_enabled boolean not null default false;

alter table invoices
  add column stripe_checkout_session_id text;
