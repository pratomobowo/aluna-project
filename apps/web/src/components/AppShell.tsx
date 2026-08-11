import { NavLink, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Coins, Gift, Leaf, LogOut, Map, NotebookPen, Shield, User } from "lucide-react";
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
      {/* Desktop header */}
      <header className="sticky top-0 z-40 hidden border-b border-border bg-background/90 backdrop-blur lg:block">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <Leaf className="size-5 text-primary" aria-hidden />
            <span className="font-serif text-xl italic">Aluna</span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Navigasi utama">
            {NAV.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
            {user?.isTherapist && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <Shield className="size-4" aria-hidden />
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
              <Coins className="size-4" aria-hidden />
              {points.data?.balance ?? 0} poin
            </span>
            {user?.name && (
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {(user.name.split(" ")[0] ?? "A").slice(0, 1).toUpperCase()}
              </span>
            )}
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <LogOut className="size-4" aria-hidden />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Content — single column, max width on desktop */}
      <div className="mx-auto w-full max-w-md px-0 lg:max-w-5xl lg:px-6 lg:py-8">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
