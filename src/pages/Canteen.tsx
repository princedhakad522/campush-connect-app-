import { useEffect, useState } from "react";
import { UtensilsCrossed, Clock, Megaphone, Plus, Trash2, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listCanteenMenu,
  getCanteenMeta,
  addCanteenItem,
  updateCanteenItem,
  deleteCanteenItem,
  updateCanteenMeta,
} from "../lib/api";
import type { CanteenItem, CanteenMeta } from "../lib/types";
import { CANTEEN_CATEGORIES } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Field,
  Input,
  Select,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
  Badge,
} from "../components/ui";
import { firstError, isSetupError } from "../lib/utils";

export default function Canteen() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<CanteenItem[]>([]);
  const [meta, setMeta] = useState<CanteenMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<CanteenItem | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("Lunch");
  const [available, setAvailable] = useState(true);
  const [emoji, setEmoji] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [announce, setAnnounce] = useState("");
  const [openT, setOpenT] = useState("");
  const [closeT, setCloseT] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [m, mi] = await Promise.all([listCanteenMenu(), getCanteenMeta()]);
      setItems(m);
      setMeta(mi);
      if (mi) {
        setAnnounce(mi.announcement ?? "");
        setOpenT(mi.open_time ?? "");
        setCloseT(mi.close_time ?? "");
      }
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

  const openAdd = () => {
    setEditItem(null);
    setName("");
    setPrice(0);
    setCategory("Lunch");
    setAvailable(true);
    setEmoji("");
    setAddOpen(true);
  };

  const openEdit = (it: CanteenItem) => {
    setEditItem(it);
    setName(it.name);
    setPrice(it.price);
    setCategory(it.category);
    setAvailable(it.available);
    setEmoji(it.emoji);
    setAddOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) { setFormError("Item name is required."); return; }
    setSubmitting(true);
    setFormError("");
    try {
      if (editItem) {
        await updateCanteenItem(editItem.id, { name, price, category, available, emoji });
      } else {
        await addCanteenItem({ name, price, category, available, emoji });
      }
      setAddOpen(false);
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const saveMeta = async () => {
    try {
      await updateCanteenMeta({ open_time: openT, close_time: closeT, announcement: announce });
    } catch {}
  };

  const grouped = CANTEEN_CATEGORIES.map((cat) => ({
    cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Canteen"
        subtitle={`Open ${meta?.open_time ?? "—"} to ${meta?.close_time ?? "—"} · SATI Campus Canteen`}
        actions={
          isAdmin ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={saveMeta}>Save timings</Button>
              <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add item</Button>
            </div>
          ) : undefined
        }
      />

      {meta?.announcement && (
        <Card className="mb-5 flex items-center gap-3 border-amber-200 bg-amber-50">
          <Megaphone className="h-5 w-5 shrink-0 text-amber-600" />
          <span className="text-sm text-amber-800">{meta.announcement}</span>
        </Card>
      )}

      {isAdmin && meta && (
        <Card className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Canteen Settings</h3>
          <div className="flex flex-wrap gap-3">
            <Field label="Opens at">
              <Input value={openT} onChange={(e) => setOpenT(e.target.value)} placeholder="08:00 AM" />
            </Field>
            <Field label="Closes at">
              <Input value={closeT} onChange={(e) => setCloseT(e.target.value)} placeholder="07:00 PM" />
            </Field>
            <Field label="Special announcement">
              <Input value={announce} onChange={(e) => setAnnounce(e.target.value)} placeholder="e.g. Festival special on Friday" className="w-64" />
            </Field>
          </div>
        </Card>
      )}

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : items.length === 0 && !error ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-10 w-10" />}
          title="Canteen menu is empty"
          subtitle={isAdmin ? "Add the first item to get started." : "Check back soon — menu items will appear here."}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.cat}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600">
                <Clock className="h-4 w-4 text-brand-600" /> {g.cat}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((it) => (
                  <Card key={it.id} className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg">
                      {it.emoji || "🍽️"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{it.name}</span>
                        {!it.available && <Badge color="red">Sold out</Badge>}
                      </div>
                      <div className="text-xs text-slate-500">₹{it.price}</div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(it)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={async () => { await deleteCanteenItem(it.id); await load(); }}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editItem ? "Edit item" : "Add menu item"}>
        <div className="space-y-3">
          <Field label="Emoji">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="e.g. 🍛" className="w-24" />
          </Field>
          <Field label="Item name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Veg Thali" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CANTEEN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Available">
            <Select value={String(available)} onChange={(e) => setAvailable(e.target.value === "true")}>
              <option value="true">In stock</option>
              <option value="false">Sold out</option>
            </Select>
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={submit} loading={submitting} className="w-full">
            {editItem ? "Update" : "Add item"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}