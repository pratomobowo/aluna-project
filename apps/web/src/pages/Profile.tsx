import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Loader2, LogOut } from "lucide-react";
import { getSession, signOut } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { initials } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROWS = [
  { to: "/therapists", label: "Sesi saya" },
  { to: "/redeem", label: "Tukar Poin" },
  { to: "/journal", label: "Journal" },
];

const GENDERS = ["Perempuan", "Laki-laki", "Lainnya"];
const REFERRALS = ["Sosial media", "Teman", "Event", "Kerja", "Google"];

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  gender: string | null;
  birthYear: number | null;
  city: string | null;
  referralSource: string | null;
}

function SignOutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate("/login");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <button
      className="flex items-center justify-center gap-1.5 rounded-xl bg-card px-4 py-3 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:text-primary"
      aria-label="Keluar"
      disabled={logout.isPending}
      onClick={() => logout.mutate()}
    >
      {logout.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="size-4" aria-hidden />
      )}
      Keluar
    </button>
  );
}

function FieldSelect({
  id,
  value,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch<ProfileData>("/api/profile"),
    retry: false,
  });

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [referralSource, setReferralSource] = useState("");

  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.name ?? "");
    setCity(profile.data.city ?? "");
    setGender(profile.data.gender ?? "");
    setBirthYear(profile.data.birthYear ? String(profile.data.birthYear) : "");
    setReferralSource(profile.data.referralSource ?? "");
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/api/profile", {
        method: "PUT",
        body: {
          name: name || null,
          city: city || null,
          gender: gender || null,
          birthYear: birthYear ? Number(birthYear) : null,
          referralSource: referralSource || null,
        },
      }),
    onSuccess: async () => {
      toast.success("Profil tersimpan");
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  const user = session.data?.user;
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-24">
      <header className="px-5 pb-4 pt-6">
        <h1 className="font-serif text-2xl">Profil</h1>
      </header>

      <div className="flex flex-col gap-6 px-5">
        <section aria-label="Kartu profil" className="flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {initials(name || user?.name, "A")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-xl">{name || (user?.name ?? "Aluna User")}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </section>

        <section aria-label="Data dasar" className="flex flex-col gap-3">
          <h2 className="font-serif text-lg">Data dasar</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Kota</Label>
              <Input id="city" type="text" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gender">Jenis kelamin</Label>
              <FieldSelect id="gender" value={gender} options={GENDERS} placeholder="Pilih…" onChange={setGender} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="birthYear">Tahun lahir</Label>
              <Input
                id="birthYear"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referralSource">Tahu Aluna dari</Label>
              <FieldSelect
                id="referralSource"
                value={referralSource}
                options={REFERRALS}
                placeholder="Pilih…"
                onChange={setReferralSource}
              />
            </div>

            <Button type="submit" disabled={save.isPending} className="h-11 w-full gap-2">
              {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Simpan
            </Button>
          </form>
        </section>

        <section aria-label="Akun" className="flex flex-col gap-3">
          <h2 className="font-serif text-lg">Akun</h2>
          <div className="flex flex-col rounded-2xl bg-card ring-1 ring-foreground/10">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="truncate text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3.5">
              <span className="text-sm text-muted-foreground">Member sejak</span>
              <span className="truncate text-sm font-medium">{joined ?? "—"}</span>
            </div>
          </div>
          <SignOutButton />
        </section>

        <section aria-label="Menu" className="flex flex-col gap-3">
          <h2 className="font-serif text-lg">Menu</h2>
          <div className="flex flex-col rounded-2xl bg-card ring-1 ring-foreground/10">
            {ROWS.map((row) => (
              <Link
                key={row.to}
                to={row.to}
                className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium"
              >
                {row.label}
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            ))}
            {/* ponytail: Sesi saya belum ada halaman sendiri — arahkan ke therapists dulu */}
            {user?.isTherapist && (
              <Link
                to="/admin"
                className="flex items-center justify-between gap-3 border-t border-border px-4 py-3.5 text-sm font-medium"
              >
                Admin
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
