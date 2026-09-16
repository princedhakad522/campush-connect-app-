-- =============================================================
-- Campus Connect 0004 - Branch-wise events + timetable sections
-- 1. events.branch  ('' = All / campus-wide)
-- 2. timetable.section (A, B, C, ...)
-- Idempotent: safe to re-apply.
-- =============================================================

alter table public.events add column if not exists branch text not null default '';
create index if not exists idx_events_branch on public.events(branch);

alter table public.timetable add column if not exists section text not null default 'A';
create index if not exists idx_timetable_bs_section on public.timetable(branch, semester, section, day_of_week);

-- Give a few demo events a branch so the filters are populated.
update public.events set branch = 'CSE' where title in ('Hackathon 2026', 'Coding Competition');
update public.events set branch = 'Electrical' where title = 'AI/ML Workshop';
update public.events set branch = 'Mechanical' where title = 'Annual Sports Meet';
update public.events set branch = 'Cyber Security' where title = 'Placement Seminar';
update public.events set branch = '' where branch is null;

-- Existing demo timetable defaults to Section A (column default already set).
update public.timetable set section = 'A' where section is null;