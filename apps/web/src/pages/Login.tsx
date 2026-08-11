import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signInSocial } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const login = useMutation({
    mutationFn: () => signIn(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const google = useMutation({
    mutationFn: () => signInSocial("google"),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email) next.email = "Email wajib diisi";
    if (!password) next.password = "Password wajib diisi";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    login.mutate();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Leaf className="size-5 text-primary" aria-hidden />
          <span className="font-serif text-xl italic">Aluna</span>
        </div>

        <h1 className="font-serif text-3xl leading-tight">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hasil tesmu sudah menunggu.
        </p>

        <Card className="mt-6 bg-card">
          <CardContent className="flex flex-col gap-4 py-5">
            <div>
              <p className="text-sm font-medium">
                Bergabung dengan 2.400+ orang yang mulai memulihkan kesehatan
                mentalnya bersama Aluna.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" disabled={login.isPending} className="h-11 w-full gap-2">
                {login.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="size-4" aria-hidden />
                )}
                Masuk
              </Button>
            </form>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              atau
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="h-11 w-full" asChild>
              <Link to="/register">Buat Akun Gratis</Link>
            </Button>

            <Button
              variant="secondary"
              className="h-11 w-full gap-2"
              disabled={google.isPending}
              onClick={() => google.mutate()}
            >
              {google.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Lanjut dengan Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
