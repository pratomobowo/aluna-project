import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";

interface Therapist {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  rating: string | null;
  sessionCount: number | null;
  price: number;
  location: string | null;
  experienceYears: number | null;
  image: string | null;
  bio: string | null;
}

interface AdminBooking {
  id: number;
  userEmail: string | null;
  therapistName: string | null;
  date: string | null;
  time: string | null;
  mode: string;
  price: number;
  status: string;
}

interface TherapistForm {
  name: string;
  title: string;
  specialties: string;
  rating: string;
  price: string;
  location: string;
  experienceYears: string;
  bio: string;
}

const EMPTY_FORM: TherapistForm = {
  name: "",
  title: "",
  specialties: "",
  rating: "",
  price: "",
  location: "",
  experienceYears: "",
  bio: "",
};

const rupiah = new Intl.NumberFormat("id-ID");

function toForm(t: Therapist): TherapistForm {
  return {
    name: t.name,
    title: t.title,
    specialties: t.specialties.join(", "),
    rating: t.rating ?? "",
    price: String(t.price),
    location: t.location ?? "",
    experienceYears: t.experienceYears != null ? String(t.experienceYears) : "",
    bio: t.bio ?? "",
  };
}

function fromForm(f: TherapistForm) {
  return {
    name: f.name,
    title: f.title,
    specialties: f.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    rating: f.rating ? Number(f.rating) : undefined,
    price: Number(f.price),
    location: f.location || undefined,
    experienceYears: f.experienceYears ? Number(f.experienceYears) : undefined,
    bio: f.bio || undefined,
  };
}

function TherapistFormDialog({
  editing,
  onClose,
}: {
  editing: Therapist | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TherapistForm>(editing ? toForm(editing) : EMPTY_FORM);

  const set = (k: keyof TherapistForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: () =>
      editing
        ? apiFetch<Therapist>(`/api/therapists/${editing.id}`, { method: "PUT", body: fromForm(form) })
        : apiFetch<Therapist>("/api/therapists", { method: "POST", body: fromForm(form) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["therapists"] });
      toast.success(editing ? "Therapist diperbarui" : "Therapist ditambahkan");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Therapist" : "Tambah Therapist"}</DialogTitle>
          <DialogDescription>Lengkapi data therapist di bawah ini.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="t-name">Nama</Label>
            <Input id="t-name" value={form.name} onChange={set("name")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-title">Judul / Spesialisasi utama</Label>
            <Input id="t-title" value={form.title} onChange={set("title")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-spec">Spesialisasi (pisahkan dengan koma)</Label>
            <Input id="t-spec" value={form.specialties} onChange={set("specialties")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="t-price">Harga (Rp)</Label>
              <Input id="t-price" type="number" value={form.price} onChange={set("price")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-rating">Rating</Label>
              <Input id="t-rating" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={set("rating")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-location">Lokasi</Label>
              <Input id="t-location" value={form.location} onChange={set("location")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-exp">Pengalaman (tahun)</Label>
              <Input id="t-exp" type="number" value={form.experienceYears} onChange={set("experienceYears")} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-bio">Bio</Label>
            <Input id="t-bio" value={form.bio} onChange={set("bio")} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Batal</Button>
          </DialogClose>
          <Button
            disabled={save.isPending || !form.name || !form.title || !form.price}
            onClick={() => save.mutate()}
          >
            {save.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : editing ? (
              "Simpan"
            ) : (
              "Tambah"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TherapistsTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Therapist | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["therapists"],
    queryFn: () => apiFetch<Therapist[]>("/api/therapists"),
    retry: false,
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch<{ ok: true }>(`/api/therapists/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["therapists"] });
      toast.success("Therapist dihapus");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-3">
      <Button className="w-fit gap-1.5" onClick={() => setShowCreate(true)}>
        <Plus className="size-4" aria-hidden />
        Tambah Therapist
      </Button>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="sr-only">Memuat…</span>
        </div>
      ) : isError || !data ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Gagal memuat therapist.
        </p>
      ) : (
        data.map((t) => (
          <Card key={t.id} className="bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{t.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.title} • Rp{rupiah.format(t.price)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.specialties.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Edit ${t.name}`}
                  onClick={() => setEditing(t)}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Hapus ${t.name}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (confirm(`Hapus therapist ${t.name}?`)) remove.mutate(t.id);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}

      {showCreate && <TherapistFormDialog editing={null} onClose={() => setShowCreate(false)} />}
      {editing && <TherapistFormDialog editing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function BookingsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => apiFetch<AdminBooking[]>("/api/admin/bookings"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="sr-only">Memuat…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Gagal memuat bookings.
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada booking.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((b) => (
        <Card key={b.id} className="bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{b.therapistName ?? "—"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {b.userEmail ?? "—"} • {b.date ?? "—"} {b.time ?? ""}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {b.mode} • Rp{rupiah.format(b.price)}
              </p>
            </div>
            <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Admin() {
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const [tab, setTab] = useState<"therapists" | "bookings">("therapists");

  if (session.isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Memuat…</span>
      </main>
    );
  }

  if (!session.data?.user?.isTherapist) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
        <div className="flex flex-col gap-4 px-5 py-10">
          <Shield className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="font-serif text-2xl">Anda bukan admin</h1>
          <p className="text-sm text-muted-foreground">
            Halaman ini hanya untuk therapist Aluna.
          </p>
          <Button className="h-11 w-fit" asChild>
            <Link to="/">Kembali</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-12">
      <header className="flex items-center gap-2 px-5 pb-3 pt-6">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/" aria-label="Kembali">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Admin</h1>
      </header>

      <div className="px-5">
        <div className="flex gap-2" role="tablist" aria-label="Menu admin">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "therapists"}
            onClick={() => setTab("therapists")}
            className={
              tab === "therapists"
                ? "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                : "rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10"
            }
          >
            Therapist
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "bookings"}
            onClick={() => setTab("bookings")}
            className={
              tab === "bookings"
                ? "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                : "rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10"
            }
          >
            Bookings
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 pt-4">
        {tab === "therapists" ? <TherapistsTab /> : <BookingsTab />}
      </div>
    </main>
  );
}
