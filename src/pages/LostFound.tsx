import { useEffect, useState } from "react";
import { Search, Plus, MapPin, CheckCircle2, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listLostFound, createLostFound, resolveLostFound } from "../lib/api";
import type { LostFoundItem } from "../lib/types";
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
import { cn, firstError, formatDateTime, isSetupError, timeAgo } from "../lib/utils";

export default function LostFound() {
  const { user, isAdmin, isStudent } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [kind, setKind] = useState<"all" | "lost" | "found">("all");
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemKind, setItemKind] = useState<"lost" | "found">("lost");
  const [item, setItem] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listLostFound());
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

  const visible = items.filter(
    (i) =>
      (kind === "all" || i.kind === kind) &&
      (!q ||
        i.title.toLowerCase().includes(q.toLowerCase()) ||
        i.item.toLowerCase().includes(q.toLowerCase()) ||
        i.location.toLowerCase().includes(q.toLowerCase()))
  );

  const create = async () => {
    if (!title.trim() || !item.trim()) {
      setFormError("Title and item name are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createLostFound({
        title,
        description,
        kind: itemKind,
        item,
        location,
        image,
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      setItem("");
      setLocation("");
      setImage(null);
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
        title="Lost & Found"
        subtitle="Found something on campus? Lost a charger, key or book? Post it here."
        actions={isStudent && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Post item
          </Button>
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {(["all", "lost", "found"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition",
                kind === k ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {k === "all" ? "All items" : k}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items or location…" className="w-60 pl-9" />
        </div>
      </div>

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="Nothing posted yet"
          subtitle="The first post for this filter will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((i) => (
            <Card key={i.id} className="flex flex-col overflow-hidden">
              {i.image_url && <img src={i.image_url} alt={i.title} className="h-32 w-full object-cover" />}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2">
                  <Badge color={i.kind === "lost" ? "red" : "green"}>
                    {i.kind === "lost" ? "🔑 Lost" : "🎒 Found"}
                  </Badge>
                  {i.status === "resolved" && <Badge color="slate">Resolved</Badge>}
                  <span className="ml-auto text-[11px] text-slate-400">{timeAgo(i.created_at)}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-800">{i.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{i.description}</p>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Search className="h-3 w-3 text-brand-500" /> {i.item}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-brand-500" /> {i.location || "Campus"}
                  </div>
                  {i.occurred_at && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-brand-500" /> {formatDateTime(i.occurred_at)}
                    </div>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">
                    {i.reporter?.full_name ? `by ${i.reporter.full_name}` : "Campus user"}
                  </span>
                  <div className="flex items-center gap-1">
                    {(user && i.user_id === user.id) && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        await resolveLostFound(i.id, i.status !== "resolved");
                        await load();
                      }}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        {i.status === "resolved" ? "Reopen" : "Resolve"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post a lost/found item">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setItemKind("lost")}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                itemKind === "lost" ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              🔑 I lost something
            </button>
            <button
              onClick={() => setItemKind("found")}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                itemKind === "found" ? "border-green-300 bg-green-50 text-green-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              🎒 I found something
            </button>
          </div>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={itemKind === "lost" ? "e.g. Black bike key" : "e.g. Red pencil case"} />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item so it can be easily identified…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item">
              <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. Bike key" />
            </Field>
            <Field label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Library" />
            </Field>
          </div>
          <Field label="Photo (optional)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={create} loading={submitting} className="w-full">
            <Plus className="h-4 w-4" /> Post item
          </Button>
        </div>
      </Modal>
    </div>
  );
}