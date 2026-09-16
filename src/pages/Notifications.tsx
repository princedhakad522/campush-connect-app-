import { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications } from "../lib/api";
import type { AppNotification } from "../lib/types";
import { PageHeader, Button, Card, Spinner, EmptyState, ErrorBox, Badge } from "../components/ui";
import { cn, isSetupError, timeAgo } from "../lib/utils";

const typeColors: Record<string, "brand" | "green" | "amber" | "purple" | "slate"> = {
  notice: "amber",
  assignment: "purple",
  event: "brand",
  notes: "green",
  system: "slate",
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = async () => {
    setLoading(true);
    try {
      setNotifs(await listMyNotifications());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "You're all caught up."}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => markAllNotificationsRead().then(load)}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
            <Button size="sm" variant="ghost" onClick={() => clearNotifications().then(load)}>
              <Trash2 className="h-3.5 w-3.5" /> Clear read
            </Button>
          </>
        }
      />

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : notifs.length === 0 && !error ? (
        <EmptyState
          icon={<Inbox className="h-10 w-10" />}
          title="No notifications"
          subtitle="New notices, assignments and events will be notified here."
        />
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <Card
              key={n.id}
              className={cn("flex items-start gap-3 p-4 transition", !n.read && "border-brand-200 bg-brand-50/40")}
            >
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", !n.read ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400")}>
                <Bell className="h-4 w-4" />
              </div>
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => {
                  if (!n.read) markNotificationRead(n.id).then(load);
                  if (n.link) navigate(n.link);
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{n.title}</span>
                  <Badge color={typeColors[n.type] ?? "slate"}>{n.type}</Badge>
                </div>
                {n.body && <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>}
                <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}