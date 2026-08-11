import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { DailyTask, Goal, RoadmapStep } from "@aluna/shared";
import { personalizationFor, type Dimension } from "@aluna/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { initials } from "@/lib/utils";
import TopBar from "@/components/TopBar";
import JourneyMap from "@/components/JourneyMap";
import DailyTasks from "@/components/DailyTasks";

interface RoadmapResponse {
  locked: boolean;
  roadmap: RoadmapStep[];
  goal: Goal;
  unlockPrice?: number;
}

interface Therapist {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  rating: string | null;
  location: string | null;
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
  const therapists = useQuery({
    queryKey: ["therapists"],
    queryFn: () => apiFetch<Therapist[]>("/api/therapists"),
    retry: false,
  });

  const name = session.data?.user?.name?.split(" ")[0];
  const loading = session.isLoading || roadmap.isLoading;

  const noAssessment =
    !roadmap.isLoading && (roadmap.isError || !roadmap.data);

  const goal = roadmap.data?.goal;
  const totalSteps = roadmap.data?.roadmap.length ?? 0;
  const locked = roadmap.data?.locked;
  const doneCount = locked ? 1 : 2;
  const current = locked ? 2 : 3;
  const doneSteps = locked ? [1] : [1, 2];
  const percent = goal && totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  const taskPool: DailyTask[] = goal
    ? personalizationFor(goal.id as Dimension).dailyTaskPool
    : [];

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-12">
      <TopBar name={name} isTherapist={session.data?.user?.isTherapist} />

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
        <div className="flex flex-col gap-5 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {greeting()}
            </p>
            <h1 className="mt-0.5 font-serif text-2xl leading-tight">
              Perjalananmu{name ? `, ${name}` : ""}
            </h1>
          </div>

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
                {doneCount} dari {totalSteps} langkah selesai · Terus melangkah
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
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {therapists.data?.slice(0, 4).map((t) => (
                <Link
                  key={t.id}
                  to={`/therapists/${t.id}`}
                  className="w-40 shrink-0 rounded-xl bg-card ring-1 ring-foreground/10"
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
                      <p className="text-xs font-semibold text-primary">
                        Rating {t.rating}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
