import { useEffect, useState } from "react";
import { Megaphone, Plus, Pin, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listNotices, createNotice, deleteNotice } from "../lib/api";
import type { Notice } from "../lib/types";
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
import { NOTICE_CATEGORIES } from "../lib/types";
import { cn, firstError, formatDateTime, isSetupError, timeAgo } from "../lib/utils";

export default function Notices() {
  const { isStaff, user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setNotices(await listNotices());
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

  const submit = async () => {
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createNotice({ title, content, category, pinned });
      setOpen(false);
      setTitle("");
      setContent("");
      setCategory("General");
      setPinned(false);
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
        title="Notice Board"
        subtitle="Official notices from the college, teachers and administration."
        actions={
          isStaff && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Post notice
            </Button>
          )
        }
      />

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : notices.length === 0 && !error ? (
        <EmptyState icon={<Megaphone className="h-10 w-10" />} title="No notices yet" subtitle="Notices posted by staff will appear here." />
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id} className={cn("p-5", n.pinned && "border-amber-300 bg-amber-50/40")}>
              <div className="flex flex-wrap items-center gap-2">
                {n.pinned && (
                  <Badge color="amber">
                    <Pin className="mr-1 h-3 w-3" /> Pinned
                  </Badge>
                )}
                <Badge color="brand">{n.category}</Badge>
                <span className="ml-auto text-xs text-slate-400">{formatDateTime(n.created_at)}</span>
                {user && n.created_by === user.id && (
                  <button
                    onClick={async () => {
                      await deleteNotice(n.id);
                      await load();
                    }}
                    className="rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{n.title}</h3>
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">{n.content}</p>
              <div className="mt-3 text-xs text-slate-400">
                {n.author?.full_name ? `Posted by ${n.author.full_name}` : "Campus administration"} · {timeAgo(n.created_at)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post a notice">
        <div className="space-y-3">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Internal Exam Notice" />
          </Field>
          <Field label="Content">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the notice details…" className="min-h-[120px]" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {NOTICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Pin to top">
              <button
                onClick={() => setPinned(!pinned)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm font-medium transition",
                  pinned
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                {pinned ? "✓ Pinned" : "Pin notice"}
              </button>
            </Field>
          </div>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={submit} loading={submitting} className="w-full">
            <Megaphone className="h-4 w-4" /> Publish notice
          </Button>
        </div>
      </Modal>
    </div>
  );
}