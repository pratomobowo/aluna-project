import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Leaf, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const register = useMutation({
    mutationFn: () => signUp(name, email, password),
    onSuccess: async () => {
      // Wait for session refetch to complete so RootGate sees the new user
      await queryClient.refetchQueries({ queryKey: ["session"] });
      const pending = localStorage.getItem("aluna-pending-answers");
      if (pending) {
        try {
          const answers = JSON.parse(pending) as number[];
          await apiFetch("/api/assessment/submit", {
            method: "POST",
            body: { answers },
          });
          localStorage.removeItem("aluna-pending-answers");
          // Roadmap sekarang ada — refresh biar Home tampil data
          await queryClient.refetchQueries({ queryKey: ["roadmap"] });
        } catch {
          // ignore — answers stay in localStorage for the next submit
        }
      }
      navigate("/", { replace: true });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Nama wajib diisi";
    if (!email) next.email = "Email wajib diisi";
    if (!password) next.password = "Password minimal 8 karakter";
    else if (password.length < 8) next.password = "Password minimal 8 karakter";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    register.mutate();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Leaf className="size-5 text-primary" aria-hidden />
          <span className="font-serif text-xl italic">Aluna</span>
        </div>

        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" aria-hidden />
          <span className="text-sm font-medium">Perjalanan pulihmu dimulai di sini</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl leading-tight">
          Buat akun gratis
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mulai assessment, lalu dapatkan peta perjalanan yang personal untukmu.
        </p>

        <Card className="mt-6 bg-card">
          <CardContent className="flex flex-col gap-4 py-5">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" disabled={register.isPending} className="h-11 w-full gap-2">
                {register.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                Daftar
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-medium text-primary underline underline-offset-4">
                Masuk
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
