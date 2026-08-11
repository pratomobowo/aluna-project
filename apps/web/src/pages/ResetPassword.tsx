import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Leaf, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: () => resetPassword(password, token),
    onSuccess: () => setDone(true),
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!token) next.password = "Tautan reset tidak valid";
    if (password.length < 8) next.password = "Password minimal 8 karakter";
    if (confirm !== password) next.confirm = "Password tidak cocok";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    submit.mutate();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Leaf className="size-5 text-primary" aria-hidden />
          <span className="font-serif text-xl italic">Aluna</span>
        </div>

        {done ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="size-7" aria-hidden />
              </span>
              <h1 className="font-serif text-3xl leading-tight">Password diubah</h1>
              <p className="text-sm text-muted-foreground">
                Password kamu sudah diatur ulang. Masuk dengan password baru.
              </p>
            </div>
            <Button className="mt-6 h-11 w-full" asChild>
              <Link to="/login">Masuk</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl leading-tight">Buat password baru</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pilih password baru untuk akun Aluna kamu.
            </p>

            <Card className="mt-6 bg-card">
              <CardContent className="flex flex-col gap-4 py-5">
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password">Password baru</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!errors.password}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                        onClick={() => setShow((s) => !s)}
                      >
                        {show ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirm">Ulangi password</Label>
                    <Input
                      id="confirm"
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      aria-invalid={!!errors.confirm}
                    />
                    {errors.confirm && (
                      <p className="text-xs text-destructive">{errors.confirm}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={submit.isPending} className="h-11 w-full gap-2">
                    {submit.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Simpan password baru
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
