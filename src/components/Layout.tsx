import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Megaphone,
  CalendarDays,
  ClipboardCheck,
  FileText,
  PartyPopper,
  Search,
  MessagesSquare,
  Bell,
  User,
  LogOut,
  GraduationCap,
  ShieldCheck,
  CheckCheck,
  Trash2,
  School,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { logoutUser, listMyNotifications, markAllNotificationsRead, clearNotifications, markNotificationRead } from "../lib/api";
import { cn, initials, timeAgo } from "../lib/utils";
import type { AppNotification } from "../lib/types";

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [notifError, setNotifError] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    listMyNotifications()
      .then(setNotifs)
      .catch(() => setNotifError(true));
  }, [profile, bellOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!profile) return null;

  const isStaff = profile.role === "teacher" || profile.role === "admin";
  const isAdmin = profile.role === "admin";
  const unread = notifs.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const followNotification = (n: AppNotification) => {
    if (!n.read) markNotificationRead(n.id).catch(() => {});
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.link) navigate(n.link);
    setBellOpen(false);
  };

  const nav: { to: string; label: string; icon: ReactNode; end?: boolean; staff?: boolean; admin?: boolean }[] = [
    { to: "/", label: "Home", icon: <Home className="h-4 w-4" />, end: true },
    { to: "/notes", label: "Notes", icon: <BookOpen className="h-4 w-4" /> },
    { to: "/notices", label: "Notices", icon: <Megaphone className="h-4 w-4" /> },
    { to: "/timetable", label: "Timetable", icon: <CalendarDays className="h-4 w-4" /> },
    { to: "/attendance", label: "Attendance", icon: <ClipboardCheck className="h-4 w-4" /> },
    { to: "/assignments", label: "Assignments", icon: <FileText className="h-4 w-4" /> },
    { to: "/events", label: "Events", icon: <PartyPopper className="h-4 w-4" /> },
    { to: "/canteen", label: "Canteen", icon: <UtensilsCrossed className="h-4 w-4" /> },
    { to: "/hods", label: "Faculty & HODs", icon: <Users className="h-4 w-4" /> },
    { to: "/lost-found", label: "Lost & Found", icon: <Search className="h-4 w-4" /> },
    { to: "/community", label: "Community", icon: <MessagesSquare className="h-4 w-4" /> },
    { to: "/departments", label: "Departments", icon: <School className="h-4 w-4" />, staff: true },
    { to: "/admin", label: "Admin Panel", icon: <ShieldCheck className="h-4 w-4" />, admin: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight text-slate-900">Campus Connect</div>
            <div className="truncate text-[10px] uppercase tracking-widest text-slate-400">
              SATI · Vidisha
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map((item) =>
            (item.staff && !isStaff) || (item.admin && !isAdmin) ? null : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "hover:bg-slate-100 hover:text-slate-900"
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-800">{profile.full_name}</div>
              <div className="text-[10px] capitalize text-slate-400">{profile.role}</div>
            </div>
            <button onClick={handleLogout} title="Log out" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          {/* departments nav handled above; hidden */}
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">Campus Connect</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationsBell
            notifs={notifs}
            unread={unread}
            open={bellOpen}
            setOpen={setBellOpen}
            error={notifError}
            onFollow={followNotification}
            onMarkAll={() =>
              markAllNotificationsRead().then(() => setNotifs((p) => p.map((n) => ({ ...n, read: true })))).catch(() => {})
            }
            onClear={() =>
              clearNotifications().then(() => setNotifs((p) => p.filter((n) => !n.read))).catch(() => {})
            }
            innerRef={bellRef}
          />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-h-screen w-full flex-col lg:pl-60">
        <header className="sticky top-0 z-20 hidden h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur lg:flex">
          <div className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{profile.full_name}</span> 👋
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refreshProfile} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Refresh profile">
              <User className="h-4 w-4" />
            </button>
            <NotificationsBell
              notifs={notifs}
              unread={unread}
              open={bellOpen}
              setOpen={setBellOpen}
              error={notifError}
              onFollow={followNotification}
              onMarkAll={() =>
                markAllNotificationsRead().then(() => setNotifs((p) => p.map((n) => ({ ...n, read: true })))).catch(() => {})
              }
              onClear={() =>
                clearNotifications().then(() => setNotifs((p) => p.filter((n) => !n.read))).catch(() => {})
              }
innerRef={bellRef}
            />
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          {[
            { to: "/", icon: <Home className="h-5 w-5" />, label: "Home" },
            { to: "/notes", icon: <BookOpen className="h-5 w-5" />, label: "Notes" },
            { to: "/notices", icon: <Megaphone className="h-5 w-5" />, label: "Notices" },
            { to: "/events", icon: <PartyPopper className="h-5 w-5" />, label: "Events" },
            { to: "/community", icon: <MessagesSquare className="h-5 w-5" />, label: "Community" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium",
                  isActive ? "text-brand-600" : "text-slate-400"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 lg:px-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NotificationsBell({
  notifs,
  unread,
  open,
  setOpen,
  error,
  onFollow,
  onMarkAll,
  onClear,
  innerRef,
}: {
  notifs: AppNotification[];
  unread: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  error: boolean;
  onFollow: (n: AppNotification) => void;
  onMarkAll: () => void;
  onClear: () => void;
  innerRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="relative" ref={innerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            <div className="flex gap-1">
              <button onClick={onMarkAll} className="rounded p-1 text-slate-400 hover:text-brand-600" title="Mark all read">
                <CheckCheck className="h-4 w-4" />
              </button>
              <button onClick={onClear} className="rounded p-1 text-slate-400 hover:text-red-600" title="Clear read">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {error && <div className="p-3 text-xs text-amber-600">Notifications unavailable (run schema setup).</div>}
            {notifs.length === 0 && !error && (
              <div className="p-6 text-center text-sm text-slate-400">You're all caught up.</div>
            )}
            {notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => onFollow(n)}
                className={cn(
                  "block w-full border-b border-slate-50 px-3 py-2.5 text-left hover:bg-slate-50",
                  !n.read && "bg-brand-50/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </div>
                {n.body && <div className="mt-0.5 truncate text-xs text-slate-500">{n.body}</div>}
                <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{timeAgo(n.created_at)}</div>
              </button>
            ))}
          </div>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-brand-600 hover:bg-slate-100">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}