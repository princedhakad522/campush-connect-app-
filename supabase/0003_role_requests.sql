-- =============================================================
-- Campus Connect 0003 - Secure role requests
-- 1. New accounts are ALWAYS students.
-- 2. Teacher/Admin access requires an admin-approved request.
-- 3. Role requests are rate-limited (42s cooldown, enforced by trigger).
-- Apply in: Supabase Dashboard > SQL Editor, or via scripts/db.mjs
-- =============================================================

drop policy if exists "Users see own role requests; admins see all" on public.role_requests;
drop policy if exists "Signed-in users can request elevated roles" on public.role_requests;
drop policy if exists "Admins review role requests" on public.role_requests;
drop policy if exists "Admins delete role requests" on public.role_requests;

create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_role text not null check (requested_role in ('teacher','admin')),
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create index if not exists idx_role_requests_status on public.role_requests(status, created_at desc);
create index if not exists idx_role_requests_user on public.role_requests(user_id);

alter table public.role_requests enable row level security;

create policy "Users see own role requests; admins see all"
  on public.role_requests for select to authenticated
  using (user_id = auth.uid() or public.current_role() = 'admin');

create policy "Signed-in users can request elevated roles"
  on public.role_requests for insert to authenticated
  with check (user_id = auth.uid());

create policy "Admins review role requests"
  on public.role_requests for update to authenticated
  using (public.current_role() = 'admin');

create policy "Admins delete role requests"
  on public.role_requests for delete to authenticated
  using (public.current_role() = 'admin');

-- Server-enforced cooldown (exact message surfaced to the client).
create or replace function public.enforce_role_request_cooldown()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.role_requests
    where user_id = new.user_id
      and created_at > now() - interval '42 seconds'
  ) then
    raise exception 'For security purposes, you can only request this after 42 seconds';
  end if;
  return new;
end; $$;

drop trigger if exists role_requests_cooldown on public.role_requests;
create trigger role_requests_cooldown
  before insert on public.role_requests
  for each row execute function public.enforce_role_request_cooldown();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;