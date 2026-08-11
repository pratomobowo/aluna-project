import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Coins,
  Flower2,
  Loader2,
  MessagesSquare,
  NotebookPen,
  Sparkles,
  Sprout,
  Star,
} from "lucide-react";
import type { DailyTask, Goal, RoadmapStep } from "@aluna/shared";
import { personalizationFor, type Dimension } from "@aluna/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { initials } from "@/lib/utils";
import JourneyMap from "@/components/JourneyMap";
import DailyTasks from "@/components/DailyTasks";
import AppShell from "@/components/AppShell";
import SessionReminder from "@/components/SessionReminder";

interface Class {
  id: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  mode: "online" | "offline";
  price: number;
  category?: string;
  icon?: string;
}

interface Community {
  id: number;
  name: string;
  description?: string;
  memberCount: number;
  schedule?: string;
  icon?: string;
}

interface RoadmapResponse {
  locked: boolean;
  roadmap: RoadmapStep[];
  goal: Goal;
  unlockPrice?: number;
  progress?: { completedSteps: number; totalSteps: number; current: number; percent: number };
}

interface Therapist {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  rating: string | null;
  location: string | null;
}

const CLASS_ICONS: Record<string, typeof Flower2> = {
  Flower2,
  NotebookPen,
  Sprout,
  MessagesSquare,
  BookOpen: NotebookPen,
};

function classIcon(icon?: string) {
  return (icon && CLASS_ICONS[icon]) || Flower2;
}

function formatClassMeta(c: Class) {
  const date = new Date(`${c.date}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${date} · ${c.time}`;
}

function formatClassTag(c: Class) {
  const mode = c.mode === "online" ? "Online" : "Offline";
  const price = c.price === 0 ? "Gratis" : "Rp " + c.price.toLocaleString("id-ID");
  return `${mode} · ${price}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function Home() {
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const roadmap = useQuery({
    queryKey: ["roadmap"],
    queryFn: () => apiFetch<RoadmapResponse>("/api/roadmap"),
    retry: false,
  });
  const noAssessment =
    !roadmap.isLoading && (roadmap.isError || !roadmap.data);

  const goal = roadmap.data?.goal;
  const primary = goal?.id ?? null;
  const therapists = useQuery({
    queryKey: ["therapists", "dimension", primary],
    queryFn: () =>
      apiFetch<Therapist[]>(
        primary ? `/api/therapists?dimension=${primary}` : "/api/therapists"
      ),
    enabled: !noAssessment,
    retry: false,
  });

  const classes = useQuery({
    queryKey: ["classes"],
    queryFn: () => apiFetch<Class[]>("/api/classes"),
    retry: false,
  });

  const communities = useQuery({
    queryKey: ["communities"],
    queryFn: () => apiFetch<Community[]>("/api/communities"),
    retry: false,
  });

  const points = useQuery({
    queryKey: ["points"],
    queryFn: () => apiFetch<{ balance: number }>("/api/points"),
    enabled: !!session.data?.user,
    retry: false,
  });

  const name = session.data?.user?.name?.split(" ")[0];
  const loading = session.isLoading || roadmap.isLoading;

  const totalSteps = roadmap.data?.roadmap.length ?? 0;
  const progress = roadmap.data?.progress;
  const doneCount = progress?.completedSteps ?? 0;
  const current = Math.min(progress?.current ?? 1, totalSteps || 1);
  const doneSteps = Array.from({ length: doneCount }, (_, i) => i + 1);
  const percent = progress?.percent ?? 0;

  const taskPool: DailyTask[] = goal
    ? personalizationFor(goal.id as Dimension).dailyTaskPool
    : [];

  return (
    <AppShell>
      <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-24 lg:max-w-none">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="sr-only">Memuat…</span>
        </div>
      ) : noAssessment ? (
        <div className="flex flex-col gap-4 px-5 py-8">
          <h1 className="font-serif text-3xl leading-tight">
            Selamat datang{name ? `, ${name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Mulai dari assessment singkat supaya kami bisa susun rencana
            pemulihan yang sesuai untukmu.
          </p>
          <Button className="h-11 gap-2" asChild>
            <Link to="/assessment">
              <Sparkles className="size-4" aria-hidden />
              Mulai Assessment
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-5 py-4">
          <SessionReminder />
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {greeting()}
              </p>
              <h1 className="font-serif text-[23px] font-semibold leading-tight">
                Perjalananmu{name ? `, ${name}` : ""}
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                <Coins className="size-4" aria-hidden />
                {points.data?.balance ?? 0}
              </span>
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials(name, "A")}
              </span>
            </div>
          </header>

          <div className="flex flex-col gap-6">
            <Card className="bg-card">
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Menuju {goal?.label.toLowerCase()}
                  </p>
                  <p className="font-serif text-xl font-semibold text-primary">
                    {percent}%
                  </p>
                </div>
                <Progress value={percent} aria-label={`Progres menuju ${goal?.label}`} />
                <p className="text-xs text-muted-foreground">
                  Perjalanan minggu ke-3 · {doneCount} dari {totalSteps} langkah selesai
                </p>
              </CardContent>
            </Card>

            <section aria-label="Peta pemulihanmu">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-serif text-lg">Peta Pemulihanmu</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {doneCount} / {totalSteps} titik
                </span>
              </div>
              <JourneyMap
                current={current}
                done={doneSteps}
                labels={roadmap.data?.roadmap.map((s) => s.title)}
              />
            </section>

            <section aria-label="Langkah berikutnya">
              <Card className="bg-card">
                <CardContent className="flex flex-col gap-3 py-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Titik perjalananmu sekarang
                  </p>
                  <h2 className="font-serif text-xl leading-snug">
                    Konseling pertamamu
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Langkah besar berikutnya di petamu. Yuk jadwalkan — diskon 50%
                    untuk sesi pertama.
                  </p>
                  <Button className="h-11 gap-2" asChild>
                    <Link to="/therapists">
                      <ArrowRight className="size-4" aria-hidden />
                      Jadwalkan Sesi
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>

            <DailyTasks pool={taskPool} />

            <section aria-label="Therapist untukmu">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-serif text-lg">Therapist untukmu</h2>
                <Link
                  to="/therapists"
                  className="flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  Lihat semua
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div className="-mx-5 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
                {therapists.data?.slice(0, 4).map((t) => (
                  <Link
                    key={t.id}
                    to={`/therapists/${t.id}`}
                    className="w-40 shrink-0 rounded-xl bg-card ring-1 ring-foreground/10 lg:w-auto"
                  >
                    <div className="flex flex-col gap-1.5 px-4 py-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {initials(t.name)}
                      </span>
                      <p className="mt-1 line-clamp-1 font-medium">{t.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {t.specialties.join(" · ")}
                      </p>
                      {t.rating && (
                        <p className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <Star className="size-3" aria-hidden />
                          {t.rating}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section aria-label="Kelas dan event">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-serif text-lg">Kelas &amp; event</h2>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  Lihat semua
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </div>
              <div className="-mx-5 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
                {classes.data?.map((c) => {
                  const Icon = classIcon(c.icon);
                  return (
                    <div key={c.id} className="w-48 shrink-0 rounded-xl bg-card ring-1 ring-foreground/10 lg:w-auto">
                      <div className="flex flex-col px-4 py-4">
                        <span className="flex h-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-7" aria-hidden />
                        </span>
                        <p className="mt-3 line-clamp-1 font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{formatClassMeta(c)}</p>
                        <span className="mt-2 inline-flex self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {formatClassTag(c)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section aria-label="Gabung komunitas">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-serif text-lg">Gabung komunitas</h2>
              </div>
              <div className="-mx-5 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
                {communities.data?.map((com) => {
                  const Icon = classIcon(com.icon);
                  const meta = `${com.memberCount.toLocaleString("id-ID")} anggota${com.schedule ? ` · ${com.schedule}` : ""}`;
                  return (
                    <div key={com.id} className="flex w-56 shrink-0 items-center gap-3 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10 lg:w-auto">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-sm font-medium">{com.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{meta}</p>
                        <span className="mt-1 text-[10px] font-semibold text-primary">
                          Bergabung
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
      </main>
    </AppShell>
  );
}