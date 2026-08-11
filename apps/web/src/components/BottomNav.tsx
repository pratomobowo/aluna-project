import { NavLink } from "react-router-dom";
import { CalendarDays, Gift, Map, NotebookPen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Perjalanan", Icon: Map },
  // ponytail: Sesi belum ada halaman sendiri — arahkan ke therapists dulu
  { to: "/therapists", label: "Sesi", Icon: CalendarDays },
  { to: "/redeem", label: "Tukar Poin", Icon: Gift },
  { to: "/journal", label: "Journal", Icon: NotebookPen },
  { to: "/profile", label: "Profil", Icon: User },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch justify-around border-t border-border bg-card px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2"
    >
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={label}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg py-1",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <Icon className="size-5" aria-hidden />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
