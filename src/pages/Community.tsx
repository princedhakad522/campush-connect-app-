import { useEffect, useState } from "react";
import { MessagesSquare, Plus, MessageCircle, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listDiscussions,
  createDiscussion,
  deleteDiscussion,
  listReplies,
  createReply,
} from "../lib/api";
import type { Discussion, DiscussionReply } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Field,
  Textarea,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
  Badge,
} from "../components/ui";
import { cn, firstError, initials, isSetupError, timeAgo } from "../lib/utils";

function ReplyList({
  discussion,
  onClose,
}: {
  discussion: Discussion;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setReplies(await listReplies(discussion.id));
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [discussion.id]);

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await createReply(discussion.id, content);
      setContent("");
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {replies.length} replies
        </h4>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Spinner className="mx-auto" />
        ) : replies.length === 0 ? (
          <div className="text-center text-xs text-slate-400">Be the first to reply.</div>
        ) : (
          replies.map((r) => (
            <div key={r.id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                {initials(r.author?.full_name)}
              </div>
              <div className="flex-1 rounded-lg bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">{r.author?.full_name ?? "Student"}</span>
                  <span className="text-[10px] text-slate-400">{timeAgo(r.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{r.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
          {initials(profile?.full_name)}
        </div>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply…"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button size="md" onClick={send} loading={sending}>
          Reply
        </Button>
      </div>
    </div>
  );
}

export default function Community() {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [openReplies, setOpenReplies] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPosts(await listDiscussions());
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

  const post = async () => {
    if (!title.trim() || !content.trim()) {
      setFormError("Title and question are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createDiscussion({ title, content });
      setOpen(false);
      setTitle("");
      setContent("");
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
        title="Campus Community"
        subtitle="Ask questions, share updates and connect with students across the college."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Ask the campus
          </Button>
        }
      />

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : posts.length === 0 && !error ? (
        <EmptyState
          icon={<MessagesSquare className="h-10 w-10" />}
          title="No discussions yet"
          subtitle="Start the first conversation about campus life."
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => {
            const isExpanded = openReplies === p.id;
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {initials(p.author?.full_name)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{p.author?.full_name ?? "Student"}</div>
                      <div className="text-[11px] text-slate-400">{timeAgo(p.created_at)}</div>
                    </div>
                    {user && p.user_id === user.id && (
                      <button
                        onClick={async () => {
                          await deleteDiscussion(p.id);
                          await load();
                        }}
                        className="ml-auto rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{p.content}</p>
                  <button
                    onClick={() => setOpenReplies(isExpanded ? null : p.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> {p.replies ?? 0} replies
                  </button>
                </div>
                {isExpanded && (
                  <ReplyList discussion={p} onClose={() => setOpenReplies(null)} />
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Start a discussion">
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <Badge color="brand">Campus rules</Badge>
            <span className="text-xs text-slate-500">Be respectful. No spam, hate speech or ads.</span>
          </div>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kal Physics ki class kis room mein hai?" />
          </Field>
          <Field label="Details">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add context — branch, semester, time…" className="min-h-[90px]" />
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={post} loading={submitting} className="w-full">
            <Plus className="h-4 w-4" /> Post question
          </Button>
        </div>
      </Modal>
    </div>
  );
}