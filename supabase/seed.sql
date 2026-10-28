-- Idempotent catalogue seed. Re-running must not duplicate rows or reactivate retired categories.
-- Package prices are inserted only when missing so an administrator change is kept.

insert into public.categories (slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set)
values
  ('youtube', 'YouTube', 'Channels and YouTube creators with a public page.', 1, true, 'creators', 'Creators', 1, 'creator'),
  ('streaming', 'Streaming', 'Live streamers on Twitch, Kick, YouTube, and similar public platforms.', 2, true, 'creators', 'Creators', 1, 'creator'),
  ('gaming', 'Gaming', 'Players and gaming creators. Gambling and cheating services are excluded.', 3, true, 'creators', 'Creators', 1, 'creator'),
  ('esports', 'Esports', 'Players, teams, and competitive organisations with a public profile.', 4, true, 'creators', 'Creators', 1, 'creator'),
  ('clips', 'Clips', 'Short-form creators on Shorts, TikTok, Reels, and clip channels.', 5, true, 'creators', 'Creators', 1, 'creator'),
  ('communities', 'Communities', 'Game communities, shows, and other public creator pages.', 6, true, 'creators', 'Creators', 1, 'creator')
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
  'achievements-skills', 'fitness-lifestyle',
  'websites-saas', 'business-startups', 'developer-tools', 'instagram-pages',
  'youtube-channels', 'other-online-profiles', 'gaming-esports', 'art-creative-work',
  'music-entertainment', 'skills-portfolios'
);

insert into public.ad_packages (slug, name, description, price_paise, duration_hours, placement, exclusive, is_active, sort_order)
values
  ('daily-featured', 'Daily featured profile', 'Labelled advertisement beside discovery for 24 hours from activation. It does not change the organic score.', 19900, 24, 'daily_featured', false, true, 1),
  ('weekly-featured', 'Weekly featured profile', 'Labelled advertisement on the creator directory for seven days from activation. Organic profiles keep their own score.', 99900, 168, 'weekly_featured', false, true, 2),
  ('weekly-category-sponsor', 'Weekly lane sponsor', 'Labelled sponsorship on one creator lane for seven days from activation. The organic list in that lane is unchanged.', 199900, 168, 'category_sponsor', false, true, 3)
on conflict (slug) do nothing;
