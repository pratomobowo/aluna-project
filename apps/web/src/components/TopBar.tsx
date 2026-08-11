import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Leaf, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth";
import { initials } from "@/lib/utils";

export default function TopBar({ name }: { name?: string }) {
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
    <header className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-2">
        <Leaf className="size-5 text-primary" aria-hidden />
        <span className="font-serif text-lg italic">Aluna</span>
      </div>
      <div className="flex items-center gap-2">
        <Avatar className="bg-primary text-primary-foreground">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials(name, "A")}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Keluar"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="size-4" aria-hidden />
          )}
        </Button>
      </div>
    </header>
  );
}
