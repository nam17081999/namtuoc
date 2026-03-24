create table if not exists photo_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users default auth.uid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists photo_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users default auth.uid(),
  folder_id uuid references photo_folders on delete set null,
  file_name text not null,
  file_path text not null unique,
  public_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists photo_items_updated_at on photo_items;
create trigger photo_items_updated_at
before update on photo_items
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects
for select using (bucket_id = 'photos');

drop policy if exists "photos_public_insert" on storage.objects;
create policy "photos_public_insert" on storage.objects
for insert with check (bucket_id = 'photos');

drop policy if exists "photos_public_update" on storage.objects;
create policy "photos_public_update" on storage.objects
for update using (bucket_id = 'photos') with check (bucket_id = 'photos');

drop policy if exists "photos_public_delete" on storage.objects;
create policy "photos_public_delete" on storage.objects
for delete using (bucket_id = 'photos');
