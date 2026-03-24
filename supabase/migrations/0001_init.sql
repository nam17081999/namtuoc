create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists note_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  title text,
  content text,
  folder_id uuid references note_folders on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger notes_updated_at
before update on notes
for each row execute function public.set_updated_at();

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

create table if not exists note_tags (
  note_id uuid references notes on delete cascade,
  tag_id uuid references tags on delete cascade,
  primary key (note_id, tag_id)
);

create table if not exists money_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger money_sessions_updated_at
before update on money_sessions
for each row execute function public.set_updated_at();

create table if not exists money_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references money_sessions on delete cascade,
  denomination int not null,
  quantity int not null,
  unique (session_id, denomination)
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  type text not null check (type in ('cash', 'bank', 'gold')),
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  type text not null check (type in ('expense','income','transfer','buy_gold','sell_gold')),
  from_account uuid references accounts,
  to_account uuid references accounts,
  amount numeric(14,2) not null,
  category text,
  note text,
  created_at timestamptz default now()
);

create table if not exists gold_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  quantity_chi numeric(10,2) not null default 0
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

alter table note_folders enable row level security;
alter table notes enable row level security;
alter table tags enable row level security;
alter table note_tags enable row level security;
alter table money_sessions enable row level security;
alter table money_items enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table gold_holdings enable row level security;
alter table categories enable row level security;

create policy "note_folders_owner" on note_folders
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes_owner" on notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tags_owner" on tags
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "note_tags_owner" on note_tags
for all using (
  exists (
    select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()
  )
);

create policy "money_sessions_owner" on money_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "money_items_owner" on money_items
for all using (
  exists (
    select 1 from money_sessions where money_sessions.id = money_items.session_id and money_sessions.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from money_sessions where money_sessions.id = money_items.session_id and money_sessions.user_id = auth.uid()
  )
);

create policy "accounts_owner" on accounts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_owner" on transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "gold_holdings_owner" on gold_holdings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_owner" on categories
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
