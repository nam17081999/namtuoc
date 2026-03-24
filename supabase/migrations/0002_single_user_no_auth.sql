-- Single-user mode without auth/signup calls.
-- This migration removes auth.uid()-dependent constraints and disables RLS
-- so the frontend can use only the publishable key without any login flow.

alter table note_folders disable row level security;
alter table notes disable row level security;
alter table tags disable row level security;
alter table note_tags disable row level security;
alter table money_sessions disable row level security;
alter table money_items disable row level security;
alter table accounts disable row level security;
alter table transactions disable row level security;
alter table gold_holdings disable row level security;
alter table categories disable row level security;

drop policy if exists "note_folders_owner" on note_folders;
drop policy if exists "notes_owner" on notes;
drop policy if exists "tags_owner" on tags;
drop policy if exists "note_tags_owner" on note_tags;
drop policy if exists "money_sessions_owner" on money_sessions;
drop policy if exists "money_items_owner" on money_items;
drop policy if exists "accounts_owner" on accounts;
drop policy if exists "transactions_owner" on transactions;
drop policy if exists "gold_holdings_owner" on gold_holdings;
drop policy if exists "categories_owner" on categories;

alter table note_folders alter column user_id drop not null;
alter table notes alter column user_id drop not null;
alter table tags alter column user_id drop not null;
alter table money_sessions alter column user_id drop not null;
alter table accounts alter column user_id drop not null;
alter table transactions alter column user_id drop not null;
alter table gold_holdings alter column user_id drop not null;
alter table categories alter column user_id drop not null;

alter table note_folders alter column user_id drop default;
alter table notes alter column user_id drop default;
alter table tags alter column user_id drop default;
alter table money_sessions alter column user_id drop default;
alter table accounts alter column user_id drop default;
alter table transactions alter column user_id drop default;
alter table gold_holdings alter column user_id drop default;
alter table categories alter column user_id drop default;
