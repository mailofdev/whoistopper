-- Idempotent catalogue seed. Re-running must not duplicate rows or reactivate retired categories.
-- Package prices are inserted only when missing so an administrator change is kept.

insert into public.categories (slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set)
values
  ('websites-saas', 'Websites & SaaS', 'Public websites, web apps, and software products.', 1, true, 'directory', 'Directory', 1, 'websites-saas'),
  ('business-startups', 'Business & Startups', 'Companies, brands, and service businesses with a public page.', 2, true, 'directory', 'Directory', 1, 'business-startups'),
  ('developer-tools', 'Developer Tools', 'Libraries, APIs, CLIs, and other tools for people building software.', 3, true, 'directory', 'Directory', 1, 'developer-tools'),
  ('instagram-pages', 'Instagram Pages', 'Public Instagram pages. Account passwords and private data are never collected.', 4, true, 'directory', 'Directory', 1, 'instagram-pages'),
  ('youtube-channels', 'YouTube Channels', 'Public YouTube channels. Listing a channel does not verify its audience.', 5, true, 'directory', 'Directory', 1, 'youtube-channels'),
  ('other-online-profiles', 'Other Online Profiles', 'Public profiles on LinkedIn, X, a personal site, or a similar network.', 6, true, 'directory', 'Directory', 1, 'other-online-profiles'),
  ('gaming-esports', 'Gaming & Esports', 'Players, teams, tournaments, communities, and gaming websites.', 7, true, 'directory', 'Directory', 1, 'gaming-esports'),
  ('art-creative-work', 'Art & Creative Work', 'Public portfolios of illustration, photography, design, writing, and animation.', 8, true, 'directory', 'Directory', 1, 'art-creative-work'),
  ('music-entertainment', 'Music & Entertainment', 'Musicians, podcasts, entertainment channels, and public events.', 9, true, 'directory', 'Directory', 1, 'music-entertainment'),
  ('skills-portfolios', 'Skills & Portfolios', 'Professional profiles and portfolios.', 10, true, 'directory', 'Directory', 1, 'skills-portfolios')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = true,
    group_slug = excluded.group_slug,
    group_name = excluded.group_name,
    group_sort = excluded.group_sort,
    field_set = excluded.field_set;

update public.categories
set is_active = false
where slug in (
  'saas', 'fintech', 'commerce', 'education', 'health', 'climate', 'media',
  'cars-bikes', 'luxury-gadgets', 'travel-experiences', 'fashion-collections',
  'achievements-skills', 'fitness-lifestyle'
);

insert into public.ad_packages (slug, name, description, price_paise, duration_hours, placement, exclusive, is_active, sort_order)
values
  ('daily-featured', 'Daily Featured Listing', 'Labelled advertisement on Today''s Featured Ads for 24 hours from activation.', 19900, 24, 'daily_featured', false, true, 1),
  ('weekly-featured', 'Weekly Featured Listing', 'Labelled advertisement on the permanent directory for seven days from activation.', 99900, 168, 'weekly_featured', false, true, 2),
  ('weekly-category-sponsor', 'Weekly Category Sponsor', 'Labelled category sponsorship for seven days from activation.', 199900, 168, 'category_sponsor', false, true, 3)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    duration_hours = excluded.duration_hours,
    placement = excluded.placement,
    exclusive = excluded.exclusive,
    is_active = true,
    sort_order = excluded.sort_order;
