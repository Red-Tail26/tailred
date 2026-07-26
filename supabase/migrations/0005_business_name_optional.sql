-- Business name is now optional per user request — someone should be
-- able to save a partial profile (or none at all) and fill it in later.

alter table business_profile
  alter column business_name drop not null;
