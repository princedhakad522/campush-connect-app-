export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function isPastDue(due: string | null | undefined) {
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(text: string, len = 140) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len).trimEnd() + "…" : text;
}

export function fileSizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isSetupError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return /relation .* does not exist|Could not find the table|Not Found|relation does not exist/i.test(msg);
}

export function firstError(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const any = error as any;
    if (any.message) return String(any.message);
    if (any.details) return String(any.details);
  }
  return String(error);
}