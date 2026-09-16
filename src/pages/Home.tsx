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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getHomeStats, listNotices, listEvents } from "../lib/api";
import { Card, Spinner, ErrorBox, EmptyState, Badge, PageHeader } from "../components/ui";
import { cn, formatDateTime, isSetupError, initials, timeAgo } from "../lib/utils";
import type { Notice, CampusEvent } from "../lib/types";

const quickActions = [
  { to: "/notes", label: "Notes", icon: BookOpen, color: "bg-brand-50 text-brand-600" },
  { to: "/timetable", label: "Timetable", icon: CalendarDays, color: "bg-violet-50 text-violet-600" },
  { to: "/notices", label: "Notices", icon: Megaphone, color: "bg-amber-50 text-amber-600" },
  { to: "/assignments", label: "Assignments", icon: FileText, color: "bg-rose-50 text-rose-600" },
  { to: "/events", label: "Events", icon: PartyPopper, color: "bg-emerald-50 text-emerald-600" },
  { to: "/lost-found", label: "Lost & Found", icon: Search, color: "bg-cyan-50 text-cyan-600" },
  { to: "/community", label: "Community", icon: MessagesSquare, color: "bg-indigo-50 text-indigo-600" },
];

export default function Home() {
  const { profile, isStaff } = useAuth();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, n, e] = await Promise.all([getHomeStats(), listNotices(), listEvents()]);
        setStats(s as unknown as Record<string, number>);
        setNotices(n);
        setEvents(e.filter((ev) => new Date(ev.event_date).getTime() >= Date.now()).slice(0, 3));
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner className="mx-auto mt-20" />;

  const statCards = [
    { label: "Notes", value: stats?.notes ?? 0, to: "/notes" },
    { label: "Upcoming events", value: stats?.events ?? 0, to: "/events" },
    { label: "Assignments", value: stats?.assignments ?? 0, to: "/assignments" },
    { label: "Open lost items", value: stats?.openLostFound ?? 0, to: "/lost-found" },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${profile?.full_name?.split(" ")[0]}!`}
        subtitle={isStaff ? "Manage your campus from here." : "Here's what's happening on campus today."}
        actions={
          <Link to="/notifications" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
            <Bell className="h-4 w-4" />
            {stats?.unreadNotifications ? `${stats.unreadNotifications} new` : "Notifications"}
          </Link>
        }
      />

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
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="flex flex-col items-center gap-2 p-4 text-center transition hover:border-brand-300 hover:shadow">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", a.color)}>
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-700">{a.label}</span>
            </Card>
          </Link>
        ))}
        <Link to="/attendance">
          <Card className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-slate-300 transition hover:border-brand-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-slate-400">More…</span>
          </Card>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Latest notices */}
        <div>
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
            {notices.slice(0, 5).map((n) => (
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
            {events.map((ev) => (
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
                      {ev.location || "Campus"} · {formatDateTime(ev.event_date)}
                    </p>
                    <Badge color="purple" className="mt-1">{ev.category}</Badge>
                  </div>
                  {ev.registered && <Badge color="green">Registered</Badge>}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}