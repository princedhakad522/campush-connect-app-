-- =============================================================
-- Campus Connect 0005 - Canteen, Faculty (HODs) + Events polish
-- Idempotent: safe to re-apply.
-- =============================================================

-- ---------------- CANTEEN ----------------
create table if not exists public.canteen_menu (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null default 0,
  category text not null default 'Other',
  available boolean not null default true,
  emoji text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.canteen_meta (
  id boolean primary key default true check (id = true),
  open_time text not null default '08:00 AM',
  close_time text not null default '07:00 PM',
  announcement text default '',
  updated_at timestamptz not null default now()
);

insert into public.canteen_meta (id, open_time, close_time, announcement)
values (true, '08:00 AM', '07:00 PM', 'Special festival menu on Fridays.')
on conflict (id) do update set
  open_time = excluded.open_time,
  close_time = excluded.close_time,
  updated_at = now();

insert into public.canteen_menu (name, price, category, available, emoji)
select * from (values
  ('Aloo Paratha', 40, 'Breakfast', true, '🥟'),
  ('Poha', 25, 'Breakfast', true, '🍚'),
  ('Chole Bhature', 60, 'Lunch', true, '🧆'),
  ('Dal Tadka + Rice', 70, 'Lunch', true, '🍛'),
  ('Veg Thali', 90, 'Lunch', true, '🍽️'),
  ('Samosa', 15, 'Snacks', true, '🥟'),
  ('Vada Pav', 20, 'Snacks', true, '🍔'),
  ('Cold Coffee', 40, 'Beverages', true, '🥤'),
  ('Masala Chai', 15, 'Beverages', true, '☕'),
  ('Butter Chicken + Naan', 140, 'Dinner', true, '🍛'),
  ('Paneer Lababdar + Tandoori Roti', 120, 'Dinner', true, '🫓')
) v (name, price, category, available, emoji)
where not exists (select 1 from public.canteen_menu);

-- ---------------- FACULTY / HOD ----------------
create table if not exists public.faculty (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null default 'Professor',
  department text not null default '',
  role text not null default 'HOD' check (role in ('HOD','Faculty')),
  email text default '',
  phone text default '',
  photo_url text default '',
  bio text default '',
  created_at timestamptz not null default now()
);

insert into public.faculty (name, designation, department, role, email, bio)
select * from (values
  ('Dr. Rakesh Kumar Verma', 'Professor & Head', 'Computer Science & Engineering', 'HOD', 'hod.cse@sati.ac.in', 'Ph.D. in Machine Learning, IIT Delhi. 25+ years of teaching experience.'),
  ('Dr. Neha Sharma', 'Professor & Head', 'Information Technology', 'HOD', 'hod.it@sati.ac.in', 'Ph.D. in Cloud Computing. Research focus on distributed systems.'),
  ('Dr. Manish Gupta', 'Professor & Head', 'Electrical Engineering', 'HOD', 'hod.ee@sati.ac.in', 'Ph.D. in Power Systems, MNIT Bhopal. Expert in smart grids.'),
  ('Dr. Priya Singh', 'Professor & Head', 'Electronics & Communication', 'HOD', 'hod.ece@sati.ac.in', 'Ph.D. in VLSI Design. 100+ research publications.'),
  ('Dr. Vikas Patidar', 'Professor & Head', 'Mechanical Engineering', 'HOD', 'hod.me@sati.ac.in', 'Ph.D. in Thermal Engineering. Industrial robotics specialist.'),
  ('Dr. Sangeeta Jain', 'Professor & Head', 'Civil Engineering', 'HOD', 'hod.ce@sati.ac.in', 'Ph.D. in Structural Engineering. Chartered structural engineer.'),
  ('Dr. Amit Tiwari', 'Assistant Professor', 'Computer Science & Engineering', 'Faculty', 'amit.tiwari@sati.ac.in', 'Specializes in Operating Systems and Computer Networks.'),
  ('Prof. Kavita Sahu', 'Assistant Professor', 'Mathematics', 'Faculty', 'kavita.sahu@sati.ac.in', 'Teaches Engineering Mathematics for 1st year B.Tech.')
) v (name, designation, department, role, email, bio)
where not exists (select 1 from public.faculty);

-- ---------------- EVENTS extras ----------------
alter table public.events add column if not exists start_time text default '10:00 AM';
alter table public.events add column if not exists end_time text default '04:00 PM';
alter table public.events add column if not exists organizer text default '';
alter table public.events add column if not exists registration_info text default '';

update public.events set organizer = 'Students Activity Cell, SATI' where organizer = '';

-- ---------------- RLS ----------------
alter table public.canteen_menu enable row level security;
alter table public.canteen_meta enable row level security;
alter table public.faculty enable row level security;

do $$
declare
  _pairs text[] := array[
    'public.canteen_menu.select', 'public.canteen_menu.insert',
    'public.canteen_menu.update', 'public.canteen_menu.delete',
    'public.canteen_meta.select', 'public.canteen_meta.insert',
    'public.canteen_meta.update',
    'public.faculty.select', 'public.faculty.insert',
    'public.faculty.update', 'public.faculty.delete'
  ];
  _i int;
  _t text; _op text; _rel text; _pol text;
begin
  for _i in 1..array_length(_pairs, 1) loop
    _t := format('%I.%I', split_part(_pairs[_i], '.', 1), split_part(_pairs[_i], '.', 2));
    _op := split_part(_pairs[_i], '.', 3);
    _rel := replace(_pairs[_i], '.', '_');
    _pol := _rel || '_' || _op;
    execute format('drop policy if exists %I on %s', _pol, _t);
  end loop;
end $$;

create policy canteen_menu_all_select on public.canteen_menu
  for select using (true);
create policy canteen_menu_all_insert on public.canteen_menu
  for insert with check (public.current_role() = 'admin');
create policy canteen_menu_all_update on public.canteen_menu
  for update using (public.current_role() = 'admin');
create policy canteen_menu_all_delete on public.canteen_menu
  for delete using (public.current_role() = 'admin');

create policy canteen_meta_all_select on public.canteen_meta
  for select using (true);
create policy canteen_meta_all_insert on public.canteen_meta
  for insert with check (public.current_role() = 'admin');
create policy canteen_meta_all_update on public.canteen_meta
  for update using (public.current_role() = 'admin');

create policy faculty_all_select on public.faculty
  for select using (true);
create policy faculty_all_insert on public.faculty
  for insert with check (public.current_role() = 'admin');
create policy faculty_all_update on public.faculty
  for update using (public.current_role() = 'admin');
create policy faculty_all_delete on public.faculty
  for delete using (public.current_role() = 'admin');