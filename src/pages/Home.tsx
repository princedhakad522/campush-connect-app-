import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  Megaphone,
  FileText,
  PartyPopper,
  Search,
  MessagesSquare,
  Bell,
  ArrowRight,
  ClipboardList,
  UtensilsCrossed,
  Clock,
  MapPin,
  GraduationCap,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getHomeStats, listNotices, listEvents, listCanteenMenu, getCanteenMeta, getTimetable } from "../lib/api";
import { Card, Spinner, ErrorBox, EmptyState, Badge, PageHeader } from "../components/ui";
import { cn, formatDateTime, isSetupError, timeAgo } from "../lib/utils";
import type { Notice, CampusEvent, CanteenItem, CanteenMeta, TimetableEntry } from "../lib/types";
import { DAY_LABELS } from "../lib/types";

const quickActions = [
  { to: "/notes", label: "Notes", icon: BookOpen, color: "bg-brand-50 text-brand-600" },
  { to: "/timetable", label: "Timetable", icon: CalendarDays, color: "bg-violet-50 text-violet-600" },
  { to: "/notices", label: "Notices", icon: Megaphone, color: "bg-amber-50 text-amber-600" },
  { to: "/assignments", label: "Assignments", icon: FileText, color: "bg-rose-50 text-rose-600" },
  { to: "/events", label: "Events", icon: PartyPopper, color: "bg-emerald-50 text-emerald-600" },
  { to: "/canteen", label: "Canteen", icon: UtensilsCrossed, color: "bg-orange-50 text-orange-600" },
  { to: "/hods", label: "Faculty", icon: Users, color: "bg-cyan-50 text-cyan-600" },
  { to: "/lost-found", label: "Lost & Found", icon: Search, color: "bg-sky-50 text-sky-600" },
  { to: "/community", label: "Community", icon: MessagesSquare, color: "bg-indigo-50 text-indigo-600" },
];

export default function Home() {
  const { profile, isStaff } = useAuth();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [canteen, setCanteen] = useState<CanteenItem[]>([]);
  const [canteenMeta, setCanteenMeta] = useState<CanteenMeta | null>(null);
  const [todayTimetable, setTodayTimetable] = useState<TimetableEntry[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        const [s, n, e, cm, meta] = await Promise.all([
          getHomeStats(),
          listNotices(),
          listEvents(),
          listCanteenMenu(),
          getCanteenMeta(),
        ]);
        setStats(s as unknown as Record<string, number>);
        setNotices(n);
        setEvents(e.filter((ev) => new Date(ev.event_date).getTime() >= Date.now()).slice(0, 5));
        setCanteen(cm);
        setCanteenMeta(meta);

        if (profile?.branch && profile?.semester) {
          try {
            const tt = await getTimetable(profile.branch, profile.semester, "A");
            setTodayTimetable(tt.filter((t) => t.day_of_week === dayIndex));
          } catch {}
        }
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.branch, profile?.semester]);

  if (loading) return <Spinner className="mx-auto mt-20" />;

  const statCards = [
    { label: "Notes", value: stats?.notes ?? 0, to: "/notes" },
    { label: "Events", value: stats?.events ?? 0, to: "/events" },
    { label: "Assignments", value: stats?.assignments ?? 0, to: "/assignments" },
    { label: "Lost items", value: stats?.openLostFound ?? 0, to: "/lost-found" },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const dayName = DAY_LABELS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const lunchItems = canteen.filter((i) => i.category === "Lunch" && i.available).slice(0, 3);
  const snackItems = canteen.filter((i) => i.category === "Snacks" && i.available).slice(0, 2);

  return (
    <div>
      {/* Hero / Branding */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-6 text-white shadow-lg lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-brand-200">
              <GraduationCap className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Samrat Ashok Technological Institute · Vidisha</span>
            </div>
            <h1 className="text-2xl font-bold lg:text-3xl">
              {greeting}, {profile?.full_name?.split(" ")[0]}!
            </h1>
            <p className="mt-1 text-sm text-brand-100">
              Welcome to Campus Connect — your one-stop portal for everything at SATI.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/notifications" className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
              <Bell className="h-4 w-4" />
              {stats?.unreadNotifications ? `${stats.unreadNotifications} new` : "Notifications"}
            </Link>
            <Link to="/timetable" className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
              <CalendarDays className="h-4 w-4" />
              Today's schedule
            </Link>
          </div>
        </div>
      </div>

      {!!error && (
        <div className="mb-5">
          <ErrorBox error={error} setup={isSetupError(error)} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="p-4 transition hover:border-brand-300">
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Quick Links</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="flex flex-col items-center gap-2 p-3 text-center transition hover:border-brand-300 hover:shadow">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.color)}>
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{a.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Today's timetable */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              <CalendarDays className="mr-1 inline h-4 w-4 text-brand-600" /> Today's Classes
            </h2>
            <span className="text-[11px] font-medium text-slate-400">{dayName}</span>
          </div>
          {todayTimetable.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No classes today" subtitle="Enjoy your free day!" />
          ) : (
            <div className="space-y-2">
              {todayTimetable.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <div className="shrink-0 text-center">
                    <div className="text-xs font-bold text-brand-700">{t.start_time}</div>
                    <div className="text-[10px] text-slate-400">{t.end_time}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{t.subject}</div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3" /> {t.room || "TBA"}
                    </div>
                  </div>
                </div>
              ))}
              {todayTimetable.length > 4 && (
                <Link to="/timetable" className="block text-center text-xs font-medium text-brand-600 hover:underline">
                  +{todayTimetable.length - 4} more classes
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Canteen preview */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              <UtensilsCrossed className="mr-1 inline h-4 w-4 text-orange-500" /> Canteen Today
            </h2>
            <Link to="/canteen" className="text-xs font-medium text-brand-600 hover:underline">Full menu</Link>
          </div>
          {canteenMeta && (
            <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              {canteenMeta.open_time} – {canteenMeta.close_time}
              {canteenMeta.announcement && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">{canteenMeta.announcement}</span>
              )}
            </div>
          )}
          <div className="space-y-2">
            {[...lunchItems, ...snackItems].map((it) => (
              <div key={it.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-lg">{it.emoji || "🍽️"}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{it.name}</div>
                  <div className="text-[11px] text-slate-500">{it.category}</div>
                </div>
                <span className="text-sm font-bold text-brand-700">₹{it.price}</span>
              </div>
            ))}
            {canteen.length === 0 && (
              <EmptyState icon={<UtensilsCrossed className="h-6 w-6" />} title="Menu not loaded" subtitle="" />
            )}
          </div>
        </Card>

        {/* Upcoming events */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming Events</h2>
            <Link to="/events" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {events.length === 0 && !error && (
              <EmptyState icon={<PartyPopper className="h-10 w-10" />} title="No upcoming events" subtitle="Events created by staff will appear here." />
            )}
            {events.slice(0, 4).map((ev) => (
              <Link key={ev.id} to="/events">
                <Card className="flex items-center gap-4 p-4 transition hover:border-brand-300">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <span className="text-lg font-bold leading-none">{new Date(ev.event_date).getDate()}</span>
                    <span className="text-[10px] uppercase">
                      {new Date(ev.event_date).toLocaleString("en", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-slate-800">{ev.title}</h3>
                    <p className="truncate text-xs text-slate-500">
                      {ev.location || "Campus"} · {ev.organizer || ""}
                    </p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge color="purple" className="text-[10px]">{ev.category}</Badge>
                      {ev.branch ? <Badge color="brand" className="text-[10px]">{ev.branch}</Badge> : <Badge color="slate" className="text-[10px]">All</Badge>}
                    </div>
                  </div>
                  {ev.registered && <Badge color="green">Registered</Badge>}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Latest notices */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latest Notices</h2>
          <Link to="/notices" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {notices.length === 0 && !error && (
            <EmptyState icon={<Megaphone className="h-10 w-10" />} title="No notices yet" subtitle="Notices published by staff will appear here." />
          )}
          {notices.slice(0, 3).map((n) => (
            <Link key={n.id} to="/notices">
              <Card className="p-4 transition hover:border-brand-300">
                <div className="flex items-center gap-2">
                  {n.pinned && <Badge color="amber">Pinned</Badge>}
                  <Badge color="brand">{n.category}</Badge>
                  <span className="ml-auto text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-800">{n.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.content}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}