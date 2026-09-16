-- =============================================================
-- Campus Connect - Seed data (reference data + demo content)
-- Run AFTER 0001_schema.sql
-- =============================================================

-- ---------------- Departments ----------------
insert into public.departments (name, code, description) values
  ('B.Tech Computer Science', 'CSE', 'Computer Science & Engineering'),
  ('B.Tech Information Technology', 'IT', 'Information Technology'),
  ('B.Tech Electronics', 'ECE', 'Electronics & Communication'),
  ('B.Tech Mechanical', 'ME', 'Mechanical Engineering'),
  ('B.Tech Civil', 'CE', 'Civil Engineering'),
  ('B.Tech Artificial Intelligence', 'AIML', 'AI & Machine Learning'),
  ('BCA', 'BCA', 'Bachelor of Computer Applications'),
  ('BBA', 'BBA', 'Bachelor of Business Administration')
on conflict (code) do nothing;

-- ---------------- Subjects (CSE Semester 1) ----------------
insert into public.subjects (name, code, branch, semester)
select * from (values
  ('Engineering Mathematics - I', 'M101', 'CSE', 1),
  ('Engineering Physics', 'PHY101', 'CSE', 1),
  ('Engineering Chemistry', 'CHM101', 'CSE', 1),
  ('Programming in C', 'CS101', 'CSE', 1),
  ('Basic Electrical Engineering', 'EE101', 'CSE', 1),
  ('English Communication', 'ENG101', 'CSE', 1),
  ('Data Structures', 'CS102', 'CSE', 2),
  ('Object Oriented Programming (C++)', 'CS103', 'CSE', 2),
  ('Database Management Systems', 'CS204', 'CSE', 3),
  ('Operating Systems', 'CS205', 'CSE', 3),
  ('Computer Networks', 'CS305', 'CSE', 4)
) v(name, code, branch, semester)
where not exists (select 1 from public.subjects);

-- ---------------- Demo notices ----------------
insert into public.notices (title, content, category, pinned, created_at)
select * from (values
  ('Internal Exam Notice', 'Internal examination will begin from 20 September. Attendance is mandatory for all students. Bring your Institute ID card.', 'Exam', true, now() - interval '1 day'),
  ('Mid-Semester Break', 'College will remain closed from 25 to 29 September on account of the mid-semester break.', 'Holiday', false, now() - interval '2 days'),
  ('Library Timings Update', 'The central library will now remain open from 8:00 AM to 9:00 PM on all working days.', 'General', false, now() - interval '3 days'),
  ('New Student Orientation', 'Orientation programme for new students will be held in the main auditorium at 10:00 AM.', 'Event', true, now() - interval '4 days')
) v(title, content, category, pinned, created_at)
where not exists (select 1 from public.notices);

-- ---------------- Demo events ----------------
insert into public.events (title, description, event_date, location, category)
select * from (values
  ('Hackathon 2026', '48-hour coding challenge. Build, ship and win prizes worth Rs 50,000. Teams of up to 4 members.', now() + interval '10 days', 'Innovation Lab, Block C', 'Hackathon'),
  ('Annual Sports Meet', 'Track, field and team sports across all branches. Register your events before the deadline.', now() + interval '20 days', 'College Sports Ground', 'Sports'),
  ('Cultural Fest - Srijan', 'Three days of music, dance, drama and art. Inter-college competitions open to all.', now() + interval '30 days', 'Main Auditorium', 'Cultural'),
  ('Coding Competition', 'Competitive programming contest with problems across difficulty levels. Prizes for top 3.', now() + interval '15 days', 'Computer Labs 1-3', 'Coding'),
  ('AI/ML Workshop', 'Hands-on workshop on Machine Learning fundamentals with Python and scikit-learn.', now() + interval '7 days', 'Seminar Hall 2', 'Workshop'),
  ('Placement Seminar', 'Guidance session on resume building, aptitude tests and interview preparation.', now() + interval '12 days', 'Conference Hall', 'Seminar')
) v(title, description, event_date, location, category)
where not exists (select 1 from public.events);

-- ---------------- Demo lost & found ----------------
insert into public.lost_found (title, description, kind, item, location, status, created_at)
select * from (values
  ('Black bike key lost', 'Two-door key with a black chain. Found near the main gate bike stand.', 'lost', 'Bike key', 'Main Gate', 'open', now() - interval '2 days'),
  ('Found: Red pencil case', 'Red zipper pencil case with pens and calculator inside. Handed to the sports office.', 'found', 'Pencil case', 'Sports Office', 'open', now() - interval '1 day'),
  ('Mobile charger lost', 'White 33W fast charger with Type-C cable, labelled "Amit".', 'lost', 'Charger', 'Central Library', 'open', now() - interval '3 days')
) v(title, description, kind, item, location, status, created_at)
where not exists (select 1 from public.lost_found);

-- ---------------- Demo community discussions ----------------
insert into public.discussions (title, content, created_at)
select * from (values
  ('Physics class tomorrow - which room?', 'Does anyone know the room for the Engineering Physics class on Thursday morning?', now() - interval '5 hours'),
  ('Best place to prepare for DBMS practicals', 'Any recommendations for resources or labs open in the evening for DBMS practice?', now() - interval '8 hours'),
  ('Group for Hackathon 2026', 'Looking for 2 teammates for the upcoming hackathon. Frontend and ML folks welcome.', now() - interval '1 day')
) v(title, content, created_at)
where not exists (select 1 from public.discussions);

-- ---------------- Demo timetable (CSE Sem 1) ----------------
insert into public.timetable (branch, semester, day_of_week, start_time, end_time, subject, room)
select * from (values
  ('CSE', 1, 0, '09:00', '10:00', 'Engineering Mathematics - I', 'A-101'),
  ('CSE', 1, 0, '10:00', '11:00', 'Engineering Physics', 'A-102'),
  ('CSE', 1, 0, '11:15', '12:15', 'Programming in C', 'Lab 1'),
  ('CSE', 1, 1, '09:00', '10:00', 'Engineering Chemistry', 'A-103'),
  ('CSE', 1, 1, '10:00', '11:00', 'English Communication', 'A-104'),
  ('CSE', 1, 1, '11:15', '12:15', 'Basic Electrical Engineering', 'A-105'),
  ('CSE', 1, 2, '09:00', '10:00', 'Programming in C', 'A-101'),
  ('CSE', 1, 2, '10:00', '11:00', 'Engineering Mathematics - I', 'A-101'),
  ('CSE', 1, 2, '11:15', '12:15', 'Engineering Physics (Lab)', 'Physics Lab'),
  ('CSE', 1, 3, '09:00', '10:00', 'Basic Electrical Engineering', 'A-105'),
  ('CSE', 1, 3, '10:00', '11:00', 'Engineering Chemistry (Lab)', 'Chem Lab'),
  ('CSE', 1, 3, '11:15', '12:15', 'English Communication', 'A-104'),
  ('CSE', 1, 4, '09:00', '10:00', 'Engineering Mathematics - I', 'A-101'),
  ('CSE', 1, 4, '10:00', '11:00', 'Programming in C (Lab)', 'Lab 2'),
  ('CSE', 1, 4, '11:15', '12:15', 'Library / Sports', 'Library'),
  ('CSE', 1, 5, '09:00', '11:00', 'Guest Lecture / Workshop', 'Auditorium')
) v(branch, semester, day_of_week, start_time, end_time, subject, room)
where not exists (select 1 from public.timetable);

-- ---------------- Demo assignment ----------------
insert into public.assignments (title, description, subject, branch, semester, due_date)
select * from (values
  ('C Programming Assignment 1', 'Write C programs for arrays, string handling and recursion. Submit the source files as a single PDF or ZIP.', 'Programming in C', 'CSE', 1, now() + interval '5 days'),
  ('Physics Problem Set 3', 'Solve problems on thermodynamics (Q1-Q20) from the textbook. Show all steps clearly.', 'Engineering Physics', 'CSE', 1, now() + interval '7 days'),
  ('Maths Tutorial 2', 'Solve the tutorial sheet on matrices and determinants attached in class. Handwritten solutions acceptable.', 'Engineering Mathematics - I', 'CSE', 1, now() + interval '3 days')
) v(title, description, subject, branch, semester, due_date)
where not exists (select 1 from public.assignments);

-- =============================================================
-- ACCOUNTS
-- Supabase cannot create auth user passwords via SQL.
-- Create accounts in the app UI: Sign Up → pick role
--   demo@student.college.edu  (Student)
--   demo@teacher.college.edu  (Teacher)
--   demo@admin.college.edu    (Admin)
-- Then set profile fields (branch/semester) from Profile settings.
-- =============================================================