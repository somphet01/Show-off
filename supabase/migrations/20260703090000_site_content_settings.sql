create table if not exists public.site_content_settings (
  id text primary key default 'main',
  covers jsonb not null default '[]'::jsonb,
  intro jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_content_settings_singleton check (id = 'main'),
  constraint site_content_settings_covers_array check (jsonb_typeof(covers) = 'array'),
  constraint site_content_settings_intro_object check (jsonb_typeof(intro) = 'object')
);

drop trigger if exists site_content_settings_set_updated_at on public.site_content_settings;
create trigger site_content_settings_set_updated_at
before update on public.site_content_settings
for each row execute function public.set_updated_at();

alter table public.site_content_settings enable row level security;

drop policy if exists "public reads site content settings" on public.site_content_settings;
create policy "public reads site content settings"
on public.site_content_settings for select
to anon, authenticated
using (id = 'main');

drop policy if exists "admins manage site content settings" on public.site_content_settings;
create policy "admins manage site content settings"
on public.site_content_settings for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

insert into public.site_content_settings (id, covers, intro)
values (
  'main',
  '[
    {"id":"home-hero","title":"Built to Stand Out","label":"Jackets","asset":"/assets/cover-main.png","link":"/collections/jackets","cta":"SHOP NOW","mediaType":"image","enabled":true},
    {"id":"baggy-jeans","title":"Built Different","label":"Baggy Jeans","asset":"/assets/campaign-dark.png","link":"/collections/baggy-jeans","cta":"NEW ARRIVALS","mediaType":"image","enabled":true},
    {"id":"premium-tees","title":"Premium Boxy Tees","label":"Made to Stand Out","asset":"/assets/campaign-motel.png","link":"/collections/t-shirts","cta":"SHOP THE DROP","mediaType":"image","enabled":true},
    {"id":"accessories-campaign","title":"Essential Accessories","label":"Complete Your Look","asset":"/assets/campaign-moto.png","link":"/collections/accessories","cta":"SHOP ACCESSORIES","mediaType":"image","enabled":true},
    {"id":"hoodies-campaign","title":"Essential Hoodies","label":"Built for Everyday","asset":"/assets/campaign-beach.png","link":"/collections/hoodies","cta":"DISCOVER MORE","mediaType":"image","enabled":true}
  ]'::jsonb,
  '{"enabled":true,"mediaType":"video","src":"/assets/show-off-intro.mp4","audioEnabled":true,"fadeMs":700,"durationMs":5200,"showOncePerVisit":true}'::jsonb
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public reads site media" on storage.objects;
create policy "public reads site media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-media');

drop policy if exists "admins manage site media" on storage.objects;
create policy "admins manage site media"
on storage.objects for all
to authenticated
using (bucket_id = 'site-media' and (select private.is_admin()))
with check (bucket_id = 'site-media' and (select private.is_admin()));
