import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Leaf, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: () => requestPasswordReset(email),
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      setErrors({ email: "Email wajib diisi" });
      return;
    }
    setErrors({});
    submit.mutate();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Leaf className="size-5 text-primary" aria-hidden />
          <span className="font-serif text-xl italic">Aluna</span>
        </div>

        {sent ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="size-7" aria-hidden />
              </span>
              <h1 className="font-serif text-3xl leading-tight">Cek email kamu</h1>
              <p className="text-sm text-muted-foreground">
                Kalau email {email} terdaftar, kami sudah kirim tautan untuk
                mengatur ulang password.
              </p>
            </div>
            <Button variant="outline" className="mt-6 h-11 w-full" asChild>
              <Link to="/login">Kembali ke masuk</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl leading-tight">Lupa password?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Masukkan email kamu dan kami kirim tautan untuk mengatur ulang password.
            </p>

            <Card className="mt-6 bg-card">
              <CardContent className="flex flex-col gap-4 py-5">
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

                  <Button type="submit" disabled={submit.isPending} className="h-11 w-full gap-2">
                    {submit.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Kirim tautan reset
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Ingat password?{" "}
                  <Link to="/login" className="font-medium text-primary underline underline-offset-4">
                    Masuk
                  </Link>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
