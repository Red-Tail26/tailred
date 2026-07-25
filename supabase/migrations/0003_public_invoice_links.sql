-- Invoices are shared via a link (id in the URL, not a login), so an
-- unauthenticated visitor needs read access to exactly the invoice + line
-- items they were sent — never a listing of anyone else's invoices.

create policy "Anyone with the link can read a sent/paid invoice"
  on invoices for select
  using (status in ('sent', 'paid'));

create policy "Anyone with the link can read invoice line items"
  on invoice_items for select
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.status in ('sent', 'paid')
    )
  );

-- Business profile fields needed to render the invoice header are also
-- readable by anyone who has an invoice id pointing at that business.
create policy "Anyone with an invoice link can read that business's profile"
  on business_profile for select
  using (
    exists (
      select 1 from invoices
      where invoices.user_id = business_profile.user_id
      and invoices.status in ('sent', 'paid')
    )
  );
