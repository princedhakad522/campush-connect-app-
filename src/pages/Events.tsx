import { useEffect, useState } from "react";
import { PartyPopper, Plus, MapPin, CalendarDays, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listEvents, createEvent, toggleRegistration } from "../lib/api";
import type { CampusEvent } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Field,
  Textarea,
  Select,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
  Badge,
} from "../components/ui";
import { EVENT_CATEGORIES } from "../lib/types";
import { cn, firstError, formatDateTime, isSetupError } from "../lib/utils";

export default function Events() {
  const { isStaff } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Workshop");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setEvents(await listEvents());
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

  const now = Date.now();
  const visible = events.filter((e) =>
    tab === "upcoming" ? new Date(e.event_date).getTime() >= now : new Date(e.event_date).getTime() < now
  );

  const create = async () => {
    if (!title.trim() || !eventDate) {
      setFormError("Title and date are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createEvent({
        title,
        description,
        event_date: new Date(eventDate).toISOString(),
        location,
        category,
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("Workshop");
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Hackathons, sports, fests, workshops and more — register in one tap."
        actions={
          isStaff && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create event
            </Button>
          )
        }
      />

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition",
              tab === t ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<PartyPopper className="h-10 w-10" />}
          title={tab === "upcoming" ? "No upcoming events" : "No past events"}
          subtitle={isStaff ? "Create the next big campus event." : "Check back soon for new events."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ev) => {
            const date = new Date(ev.event_date);
            const isUpcoming = date.getTime() >= now;
            return (
              <Card key={ev.id} className="flex flex-col overflow-hidden">
                {ev.image_url ? (
                  <img src={ev.image_url} alt={ev.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                    <PartyPopper className="h-12 w-12 opacity-80" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge color="purple">{ev.category}</Badge>
                    {!isUpcoming && <Badge color="slate">Completed</Badge>}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">{ev.title}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">{ev.description}</p>
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-brand-500" /> {formatDateTime(ev.event_date)}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-brand-500" /> {ev.location}
                      </div>
                    )}
                  </div>
                  {isUpcoming && (
                    <Button
                      size="sm"
                      variant={ev.registered ? "secondary" : "primary"}
                      className="mt-4"
                      onClick={async () => {
                        await toggleRegistration(ev.id);
                        await load();
                      }}
                    >
                      {ev.registered ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Registered
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create event">
        <div className="space-y-3">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hackathon 2026" />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the event…" className="min-h-[90px]" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date & time">
              <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main Auditorium" />
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={create} loading={submitting} className="w-full">
            <Plus className="h-4 w-4" /> Create event
          </Button>
        </div>
      </Modal>
    </div>
  );
}