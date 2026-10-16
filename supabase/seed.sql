-- Development seed for an empty Supabase project.
-- Categories match the mock catalogue so local switching stays predictable.
-- Do not insert fictional products into a production database.

insert into public.categories (id, slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set)
values
  ('11111111-1111-4111-8111-111111111111', 'saas', 'SaaS', 'Software sold to Indian teams and businesses.', 1, true, 'earlier', 'Earlier catalogue', 90, 'website'),
  ('22222222-2222-4222-8222-222222222222', 'developer-tools', 'Developer tools', 'Tools for people building software.', 2, true, 'earlier', 'Earlier catalogue', 90, 'website'),
  ('33333333-3333-4333-8333-333333333333', 'fintech', 'Fintech', 'Money, invoices, and ledgers for Indian businesses.', 3, true, 'earlier', 'Earlier catalogue', 90, 'website'),
  ('44444444-4444-4444-8444-444444444444', 'commerce', 'Commerce', 'Stores, catalogues, and D2C operations.', 4, true, 'earlier', 'Earlier catalogue', 90, 'website'),
  ('55555555-5555-4555-8555-555555555555', 'education', 'Education', 'Learning products for students and tutors.', 5, true, 'earlier', 'Earlier catalogue', 90, 'website'),
  ('66666666-6666-4666-8666-666666666666', 'health', 'Health', 'Clinics, wellness, and care coordination.', 6, true, 'earlier', 'Earlier catalogue', 90, 'website'),
  ('77777777-7777-4777-8777-777777777777', 'climate', 'Climate', 'Energy, weather, and local environment tools.', 7, true, 'earlier', 'Earlier catalogue', 90, 'website'),
  ('88888888-8888-4888-8888-888888888888', 'media', 'Media', 'Publishing and creative workflows.', 8, true, 'earlier', 'Earlier catalogue', 90, 'website')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    group_slug = excluded.group_slug,
    group_name = excluded.group_name,
    group_sort = excluded.group_sort,
    field_set = excluded.field_set;
