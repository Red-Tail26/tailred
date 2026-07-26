-- Captures what kind of hustle this is — supports the "many kinds of
-- hustles, not just resellers" positioning without a schema rebuild later.

alter table business_profile
  add column business_type text;
