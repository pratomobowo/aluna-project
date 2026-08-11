import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, Loader2, LogOut } from "lucide-react";
import { getSession, signOut } from "@/lib/auth";
import { initials } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

const ROWS = [
  { to: "/therapists", label: "Sesi saya" },
  { to: "/redeem", label: "Tukar Poin" },
  { to: "/journal", label: "Journal" },
];

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

export default function Profile() {
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });

  const user = session.data?.user;
  const name = user?.name;
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
            {initials(name, "A")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-xl">{name ?? "Aluna User"}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
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
