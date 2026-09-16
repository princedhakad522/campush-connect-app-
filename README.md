# Campus Connect

> Your Campus. Your Community. One App.

College-exclusive platform connecting **students, teachers and administration** in one app —
notes & PDFs, notices, timetable, attendance, assignments, events with one-tap registration,
Lost & Found, and a campus community with threaded discussions.

Built as a **React + Vite + TypeScript** SPA backed by **Supabase** (Auth, Postgres + RLS, Storage).

## Tech stack

| Layer      | Technology                               | Role                                    |
| ---------- | ---------------------------------------- | --------------------------------------- |
| Frontend   | React 18 + Vite 6 + Tailwind CSS 4       | SPA UI                                  |
| Routing    | React Router 7                           | Client-side navigation + guards         |
| State      | React Context                            | Session / profile context               |
| Data       | `@supabase/supabase-js` (typed layer)    | PostgREST queries + Storage + Auth      |
| Backend    | Supabase                                 | Auth, Postgres 17, Row Level Security, Storage buckets, REST API |
| Icons      | lucide-react                             | UI icons                                |
| Language   | TypeScript (strict)                      | Types for every data shape              |

## Features by module

- **Auth** — email/password, roles (student / teacher / admin), session persistence, password reset emails, profile setup.
- **Home dashboard** — greeting, live stats, quick actions grid, latest notices, upcoming events, unread notification count.
- **Notes** — filters by branch → semester → subject + search, file upload (staff), download, delete own.
- **Notice Board** — categories, pin-to-top, teacher/admin posting, automatic student notifications.
- **Timetable** — per branch/semester weekly grid; staff can add/remove classes.
- **Attendance** — students see % per subject + history; teachers mark a whole class present/absent per date.
- **Assignments** — staff create with attachment + due date; students submit; staff view submissions with signed URLs.
- **Events** — categories, upcoming/past tabs, one-tap register/unregister, auto-notifications.
- **Lost & Found** — lost/found posts with optional photo, location, resolve/reopen.
- **Community** — discussion posts + threaded replies with counts (report/moderation roadmap).
- **Notifications** — per-user feed: notices, assignments, events; mark all read / clear.
- **Admin** — user management (role changes), stats, CSV export, departments & subjects management.

## Roles & permissions

| Capability                  | Student | Teacher | Admin |
| --------------------------- | :-----: | :-----: | :----: |
| Read notes/notices/events   | ✅      | ✅      | ✅     |
| Upload notes / post notices | —       | ✅      | ✅     |
| Manage timetable            | —       | ✅      | ✅     |
| Mark / view all attendance  | view own| ✅      | ✅     |
| Create assignments          | —       | ✅      | ✅     |
| Register events / submit    | ✅      | —       | —      |
| Post Lost & Found / discuss | ✅      | ✅      | ✅     |
| Manage users & departments  | —       | —       | ✅     |

Enforced in the database with **Row Level Security** policies (one policy per action).

## Database

Tables: `profiles`, `departments`, `subjects`, `notes`, `notices`, `events`,
`event_registrations`, `timetable`, `attendance`, `assignments`, `submissions`,
`lost_found`, `discussions`, `discussion_replies`, `notifications`.
Plus storage buckets: `notes`, `assignments`, `submissions`, `lost_found`, `avatars`.
See `supabase/0001_schema.sql` (schema + RLS + storage) and `supabase/0002_seed.sql` (demo data).

## Getting started

### 1. Install & configure

```bash
npm install
cp .env.example .env.local   # fill with your Supabase URL + publishable key
npm run dev                  # http://localhost:5173
```

`.env` (already configured for this project):

```
VITE_SUPABASE_URL=https://jyfpwgeqztorpqlotljm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

**Never put the secret key (`sb_secret_...`) in browser code** — Supabase blocks it from
browsers. Use it only server-side (Edge Functions / this repo's `scripts/`).

### 2. Database setup (one time)

This project is already set up. For a fresh project, run in the **Supabase SQL Editor**:

1. `supabase/0001_schema.sql` — tables, RLS policies, grants, storage buckets + policies.
2. `supabase/0002_seed.sql` — seed departments, subjects, notices, events, timetable, etc.

> If you applied the schema through the Management API (see below) instead of the SQL editor,
> grants for `anon`/`authenticated` are included in `0001_schema.sql` (the `GRANTS` section).

### 3. Demo accounts

| Role    | Email                      | Password     |
| ------- | -------------------------- | ------------ |
| Student | `student@campusconnect.demo` | `Student@123` |
| Teacher | `teacher@campusconnect.demo` | `Teacher@123` |
| Admin   | `admin@campusconnect.demo`   | `Admin@123`   |

Or sign up in the app (role selectable at registration — restrict to a trusted flow in production).

## Scripts / tooling

Server-side helpers (read the Supabase secret key / access token from env — never from the browser):

```bash
$env:SUPABASE_PROJECT_REF="<ref>"
$env:SUPABASE_ACCESS_TOKEN="sbp_..."     # or SUPABASE_SECRET_KEY
node scripts/db.mjs schema               # apply schema
node scripts/db.mjs seed                 # apply seed
node scripts/create-demo-users.mjs       # create demo auth users + profiles
node scripts/verify.mjs                  # end-to-end auth + RLS checks
```

| Command        | Purpose                          |
| -------------- | -------------------------------- |
| `npm run dev`  | dev server                       |
| `npm run build`| typecheck + production build     |
| `npm run preview` | preview production build     |
| `npm run typecheck` | TypeScript check            |

## Security notes

- All browser access uses the **publishable** key; the **secret** key is reserved for server-side scripts/Edge Functions.
- RLS is enabled on every table; sensitive operations (creating notices, marking attendance, role changes) require the correct role.
- Files live in 4 public buckets (notes, assignments, lost_found, avatars) + 1 private bucket (submissions) served via signed URLs.
- **Rotate the credentials shared in this chat** after setup — they were pasted in plain text.

## Roadmap

🤖 AI Campus Assistant · QR attendance · Exam schedule builder · Clubs & societies · Digital ID card ·
placement dashboard · college marketplace · push notifications (Supabase Realtime + web push) ·
community moderation/reporting.