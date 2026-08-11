import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Coins, Gift, Leaf, LogOut, Map, NotebookPen, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSession, signOut } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

const NAV = [
  { to: "/", label: "Perjalanan", Icon: Map },
  { to: "/therapists", label: "Sesi", Icon: CalendarDays },
  { to: "/redeem", label: "Tukar Poin", Icon: Gift },
  { to: "/journal", label: "Journal", Icon: NotebookPen },
  { to: "/profile", label: "Profil", Icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const points = useQuery({
    queryKey: ["points"],
    queryFn: () => apiFetch<{ balance: number }>("/api/points"),
    enabled: !!session.data?.user,
    retry: false,
  });

  const logout = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate("/login");
    },
    onError: (err) => toast.error(err.message),
  });

  const user = session.data?.user;

  return (
    <div className="min-h-dvh bg-background lg:bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background px-4 py-6 lg:flex">
        <div className="flex items-center gap-2 px-2">
          <Leaf className="size-5 text-primary" aria-hidden />
          <span className="font-serif text-xl italic">Aluna</span>
        </div>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Navigasi utama">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="size-4.5" aria-hidden />
              {label}
            </NavLink>
          ))}
          {user?.isTherapist && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Shield className="size-4.5" aria-hidden />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <Coins className="size-4" aria-hidden /> {points.data?.balance ?? 0} poin
            </span>
          </div>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <LogOut className="size-4.5" aria-hidden />
            Keluar
          </button>
        </div>
      </aside>

      {/* Content — narrow column on mobile, wide on desktop */}
      <div className="lg:pl-64">
        <div className="mx-auto w-full max-w-md px-0 lg:max-w-5xl lg:px-8 lg:py-8">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
