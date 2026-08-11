import { Link } from "react-router-dom";
import { HeartHandshake, Home, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOTLINES = [
  { number: "119", name: "SALUR (Sehat Mental Anda untuk Pulih)", note: "Layanan bebas pulsa 24 jam" },
  { number: "021-500-454", name: "Hotline Sehat Jiwa Kemenkes", note: "Layanan kesehatan jiwa" },
];

export default function Safety() {
  return (
    <main className="flex min-h-dvh flex-col bg-primary/10 px-6 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="mt-4 flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/15">
            <HeartHandshake className="size-8 text-primary" aria-hidden />
          </span>
          <h1 className="mt-6 font-serif text-3xl leading-tight">Kamu tidak sendirian</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Terima kasih sudah jujur dengan perasaanmu. Itu langkah yang berani. Perasaan
            yang kamu alami sekarang penting, dan ada orang yang siap mendengarkanmu.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bicaralah sekarang
          </h2>
          {HOTLINES.map((hotline) => (
            <a
              key={hotline.number}
              href={`tel:${hotline.number.replace(/-/g, "")}`}
              className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-primary/15 transition-colors hover:bg-primary/5 active:scale-[0.98]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="size-5 text-primary" aria-hidden />
              </span>
              <span>
                <span className="block font-serif text-lg font-semibold text-primary">
                  {hotline.number}
                </span>
                <span className="block text-sm font-medium">{hotline.name}</span>
                <span className="block text-xs text-muted-foreground">{hotline.note}</span>
              </span>
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Kalau kamu atau orang terdekat sedang dalam bahaya langsung, jangan ragu
          menghubungi bantuan darurat. Berbicara dengan profesional kesehatan jiwa atau
          orang yang kamu percaya bisa membuat banyak perbedaan.
        </p>

        <div className="mt-auto pt-8">
          <Button className="h-12 w-full gap-2" asChild>
            <Link to="/">
              <Home className="size-4" aria-hidden />
              Kembali ke Beranda
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
