-- =============================================================
-- Campus Connect - Full database schema + Row Level Security
-- Apply this file in: Supabase Dashboard > SQL Editor > New query
-- (Run the whole file at once. Buckets + policies included.)
-- Idempotent: safe to re-run (policies are dropped then recreated).
-- =============================================================

-- Drop all app policies (schema + storage) so this file can be re-applied.
do $$
declare
  _pairs text[] := array[
    'profiles.Profiles are readable by signed-in users',
    'profiles.Users can insert their own profile',
    'profiles.Users can update their own profile',
    'profiles.Admins can update any profile',
    'departments.Departments are readable by signed-in users',
    'departments.Admins and teachers can manage departments',
    'subjects.Subjects are readable by signed-in users',
    'subjects.Admins and teachers can manage subjects',
    'notes.Notes are readable by signed-in users',
    'notes.Teachers and admins can upload notes',
    'notes.Uploader can delete own notes',
    'notices.Notices are readable by signed-in users',
    'notices.Teachers and admins can post notices',
    'notices.Creators can delete own notices',
    'events.Events are readable by signed-in users',
    'events.Admins and teachers can create events',
    'event_registrations.Users can register for events and see own registrations',
    'event_registrations.Users can register for an event',
    'event_registrations.Users can unregister',
    'timetable.Timetable is readable by signed-in users',
    'timetable.Teachers and admins manage timetable',
    'attendance.Students see own attendance',
    'attendance.Teachers and admins mark attendance',
    'assignments.Assignments are readable by signed-in users',
    'assignments.Teachers and admins create assignments',
    'submissions.Students can see own submissions; staff see all',
    'submissions.Students submit assignments',
    'submissions.Students can update own submission',
    'lost_found.Lost & Found is readable by signed-in users',
    'lost_found.Signed-in users can post items',
    'lost_found.Posters can update or resolve own items',
    'lost_found.Admins can delete items',
    'discussions.Discussions are readable by signed-in users',
    'discussions.Signed-in users can post discussions',
    'discussions.Posters can edit/delete own discussions',
    'discussion_replies.Replies are readable by signed-in users',
    'discussion_replies.Signed-in users can reply',
    'discussion_replies.Repliers can delete own replies',
    'notifications.Users read and manage own notifications',
    'notifications.Users can mark own notifications as read',
    'notifications.Users can delete own notifications',
    'notifications.Signed-in users can create notifications they authored'
  ];
  _t text; _p text; _i int;
begin
  for _i in 1..array_length(_pairs, 1) loop
    _t := split_part(_pairs[_i], '.', 1);
    _p := replace(_pairs[_i], _t || '.', '');
    execute format('drop policy if exists %I on public.%I', _p, _t);
  end loop;
  execute 'drop policy if exists "Notes files readable" on storage.objects';
  execute 'drop policy if exists "Notes files uploadable by staff" on storage.objects';
  execute 'drop policy if exists "Assignment files readable" on storage.objects';
  execute 'drop policy if exists "Assignment files uploadable by staff" on storage.objects';
  execute 'drop policy if exists "Students upload submissions" on storage.objects';
  execute 'drop policy if exists "Submission files readable" on storage.objects';
  execute 'drop policy if exists "Lost&Found files uploadable" on storage.objects';
  execute 'drop policy if exists "Lost&Found files readable" on storage.objects';
  execute 'drop policy if exists "Avatars readable" on storage.objects';
  execute 'drop policy if exists "Avatars uploadable" on storage.objects';
end $$;

-- ---------------- PROFILES ----------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  branch text default null,
  semester int default null,
  roll_number text default null,
  faculty_id text default null,
  avatar_url text default null,
  created_at timestamptz not null default now()
);

-- ---------------- DEPARTMENTS / BRANCHES ----------------
create table if not exists public.departments (
  id bigint generated always as identity primary key,
  name text not null,
  code text not null unique,
  description text default '',
  created_at timestamptz not null default now()
);

-- ---------------- SUBJECTS ----------------
create table if not exists public.subjects (
  id bigint generated always as identity primary key,
  name text not null,
  code text not null,
  branch text default '',
  semester int default 1,
  selected boolean default true,
  created_at timestamptz not null default now()
);

-- ---------------- NOTES ----------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  subject text not null,
  branch text not null default '',
  semester int not null default 1,
  file_url text not null,
  file_name text default '',
  file_type text default '',
  uploader_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------- NOTICES ----------------
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  category text not null default 'General',
  pinned boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------- EVENTS ----------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date timestamptz not null default now(),
  location text default '',
  image_url text default '',
  category text not null default 'Other',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------- TIMETABLE ----------------
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  branch text not null default '',
  semester int not null default 1,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time text not null default '09:00',
  end_time text not null default '10:00',
  subject text not null default '',
  room text default '',
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------- ATTENDANCE ----------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null default '',
  date date not null default current_date,
  status text not null default 'present' check (status in ('present','absent')),
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, subject, date)
);

-- ---------------- ASSIGNMENTS ----------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  subject text not null default '',
  branch text not null default '',
  semester int not null default 1,
  due_date timestamptz,
  file_url text default '',
  file_name text default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  file_url text not null default '',
  file_name text not null default '',
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- ---------------- LOST & FOUND ----------------
create table if not exists public.lost_found (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  kind text not null default 'lost' check (kind in ('lost','found')),
  item text default '',
  location text default '',
  occurred_at timestamptz,
  image_url text default '',
  user_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);

-- ---------------- COMMUNITY ----------------
create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------- NOTIFICATIONS ----------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text default '',
  type text not null default 'system',
  link text default '',
  read boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------- INDEXES ----------------
create index if not exists idx_notes_branch_semester on public.notes(branch, semester);
create index if not exists idx_notices_pinned on public.notices(pinned desc, created_at desc);
create index if not exists idx_events_date on public.events(event_date);
create index if not exists idx_timetable_bs on public.timetable(branch, semester, day_of_week);
create index if not exists idx_attendance_student on public.attendance(student_id, date desc);
create index if not exists idx_assignments_due on public.assignments(due_date);
create index if not exists idx_lost_found_status on public.lost_found(status, created_at desc);
create index if not exists idx_discussions_created on public.discussions(created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, read, created_at desc);

-- ---------------- GRANTS ----------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant select, update, usage on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.subjects enable row level security;
alter table public.notes enable row level security;
alter table public.notices enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.timetable enable row level security;
alter table public.attendance enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.lost_found enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.notifications enable row level security;

-- Helper: current user role
create or replace function public.current_role() returns text
language sql stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------- PROFILES ----------------
create policy "Profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (id = auth.uid());
create policy "Admins can update any profile"
  on public.profiles for update to authenticated using (public.current_role() = 'admin');

-- ------------- DEPARTMENTS ----------------
create policy "Departments are readable by signed-in users"
  on public.departments for select to authenticated using (true);
create policy "Admins and teachers can manage departments"
  on public.departments for all to authenticated using (public.current_role() in ('admin','teacher'))
  with check (public.current_role() in ('admin','teacher'));

-- ------------- SUBJECTS ----------------
create policy "Subjects are readable by signed-in users"
  on public.subjects for select to authenticated using (true);
create policy "Admins and teachers can manage subjects"
  on public.subjects for all to authenticated using (public.current_role() in ('admin','teacher'))
  with check (public.current_role() in ('admin','teacher'));

-- ------------- NOTES ----------------
create policy "Notes are readable by signed-in users"
  on public.notes for select to authenticated using (true);
create policy "Teachers and admins can upload notes"
  on public.notes for insert to authenticated
  with check (public.current_role() in ('teacher','admin'));
create policy "Uploader can delete own notes"
  on public.notes for delete to authenticated using (uploader_id = auth.uid());

-- ------------- NOTICES ----------------
create policy "Notices are readable by signed-in users"
  on public.notices for select to authenticated using (true);
create policy "Teachers and admins can post notices"
  on public.notices for insert to authenticated
  with check (public.current_role() in ('teacher','admin'));
create policy "Creators can delete own notices"
  on public.notices for delete to authenticated using (created_by = auth.uid());

-- ------------- EVENTS ----------------
create policy "Events are readable by signed-in users"
  on public.events for select to authenticated using (true);
create policy "Admins and teachers can create events"
  on public.events for insert to authenticated
  with check (public.current_role() in ('teacher','admin'));

-- ------------- EVENT REGISTRATIONS ----------------
create policy "Users can register for events and see own registrations"
  on public.event_registrations for select to authenticated using (user_id = auth.uid() or public.current_role() in ('admin','teacher'));
create policy "Users can register for an event"
  on public.event_registrations for insert to authenticated with check (user_id = auth.uid());
create policy "Users can unregister"
  on public.event_registrations for delete to authenticated using (user_id = auth.uid());

-- ------------- TIMETABLE ----------------
create policy "Timetable is readable by signed-in users"
  on public.timetable for select to authenticated using (true);
create policy "Teachers and admins manage timetable"
  on public.timetable for all to authenticated using (public.current_role() in ('teacher','admin'))
  with check (public.current_role() in ('teacher','admin'));

-- ------------- ATTENDANCE ----------------
create policy "Students see own attendance"
  on public.attendance for select to authenticated using (student_id = auth.uid() or public.current_role() in ('teacher','admin'));
create policy "Teachers and admins mark attendance"
  on public.attendance for insert to authenticated
  with check (public.current_role() in ('teacher','admin'));

-- ------------- ASSIGNMENTS ----------------
create policy "Assignments are readable by signed-in users"
  on public.assignments for select to authenticated using (true);
create policy "Teachers and admins create assignments"
  on public.assignments for insert to authenticated
  with check (public.current_role() in ('teacher','admin'));

-- ------------- SUBMISSIONS ----------------
create policy "Students can see own submissions; staff see all"
  on public.submissions for select to authenticated using (student_id = auth.uid() or public.current_role() in ('teacher','admin'));
create policy "Students submit assignments"
  on public.submissions for insert to authenticated with check (student_id = auth.uid());
create policy "Students can update own submission"
  on public.submissions for update to authenticated using (student_id = auth.uid());

-- ------------- LOST & FOUND ----------------
create policy "Lost & Found is readable by signed-in users"
  on public.lost_found for select to authenticated using (true);
create policy "Signed-in users can post items"
  on public.lost_found for insert to authenticated with check (user_id = auth.uid());
create policy "Posters can update or resolve own items"
  on public.lost_found for update to authenticated using (user_id = auth.uid());
create policy "Admins can delete items"
  on public.lost_found for delete to authenticated using (public.current_role() = 'admin');

-- ------------- DISCUSSIONS ----------------
create policy "Discussions are readable by signed-in users"
  on public.discussions for select to authenticated using (true);
create policy "Signed-in users can post discussions"
  on public.discussions for insert to authenticated with check (user_id = auth.uid());
create policy "Posters can edit/delete own discussions"
  on public.discussions for all to authenticated using (user_id = auth.uid());

-- ------------- DISCUSSION REPLIES ----------------
create policy "Replies are readable by signed-in users"
  on public.discussion_replies for select to authenticated using (true);
create policy "Signed-in users can reply"
  on public.discussion_replies for insert to authenticated with check (user_id = auth.uid());
create policy "Repliers can delete own replies"
  on public.discussion_replies for delete to authenticated using (user_id = auth.uid());

-- ------------- NOTIFICATIONS ----------------
create policy "Users read and manage own notifications"
  on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users can mark own notifications as read"
  on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "Users can delete own notifications"
  on public.notifications for delete to authenticated using (user_id = auth.uid());
create policy "Signed-in users can create notifications they authored"
  on public.notifications for insert to authenticated
  with check (created_by = auth.uid());

-- =============================================================
-- STORAGE buckets + policies
-- Buckets: notes, assignments, submissions, lost_found, avatars
-- =============================================================
insert into storage.buckets (id, name, public)
values
  ('notes', 'notes', true),
  ('assignments', 'assignments', true),
  ('submissions', 'submissions', false),
  ('lost_found', 'lost_found', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- notes: staff upload, authenticated read
create policy "Notes files readable" on storage.objects for select to authenticated using (bucket_id = 'notes');
create policy "Notes files uploadable by staff" on storage.objects for insert to authenticated with check (bucket_id = 'notes' and public.current_role() in ('teacher','admin'));

-- assignments: staff upload, authenticated read
create policy "Assignment files readable" on storage.objects for select to authenticated using (bucket_id = 'assignments');
create policy "Assignment files uploadable by staff" on storage.objects for insert to authenticated with check (bucket_id = 'assignments' and public.current_role() in ('teacher','admin'));

-- submissions: student upload, read by owner + staff (owner controls access)
create policy "Students upload submissions" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Submission files readable" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.current_role() in ('teacher','admin')));

-- lost_found: authenticated upload / read
create policy "Lost&Found files uploadable" on storage.objects for insert to authenticated with check (bucket_id = 'lost_found');
create policy "Lost&Found files readable" on storage.objects for select to authenticated using (bucket_id = 'lost_found');

-- avatars: authenticated upload / read
create policy "Avatars readable" on storage.objects for select to authenticated using (bucket_id = 'avatars');
create policy "Avatars uploadable" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');