import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { computeAssessment } from "@aluna/shared";
import { QUESTIONS, DIMENSION_LABEL, type QuestionDimension } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";

export const OPTIONS = [
  { value: 0, label: "Jarang sekali" },
  { value: 1, label: "Kadang-kadang" },
  { value: 2, label: "Cukup sering" },
  { value: 3, label: "Hampir setiap hari" },
] as const;

const DIM_TAG_STYLE: Record<QuestionDimension, string> = {
  anxiety: "bg-primary/10 text-primary",
  mood: "bg-sky-100 text-sky-800",
  stress: "bg-orange-100 text-orange-800",
  trauma: "bg-purple-100 text-purple-800",
  sleep: "bg-indigo-100 text-indigo-800",
  relationship: "bg-rose-100 text-rose-800",
  self_esteem: "bg-yellow-100 text-yellow-800",
  safety: "bg-red-100 text-red-800",
};

interface SubmitResponse {
  id: number;
  result: {
    overall: number;
    label: string;
    primary: string;
    dimensions: { dimension: string; percent: number }[];
    safetyTriggered: boolean;
  };
}

export default function Assessment() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const total = QUESTIONS.length;
  const question = QUESTIONS[index];
  const selected = answers[index];

  function select(value: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function submitAll(overrideAnswers?: number[]) {
    const payload = overrideAnswers ?? answers;
    setSubmitting(true);
    try {
      const res = await apiFetch<SubmitResponse>("/api/assessment/submit", {
        method: "POST",
        body: { answers: payload },
      });
      localStorage.removeItem("aluna-pending-answers");
      navigate("/result", { state: { result: res.result } });
    } catch {
      // Not logged in → save answers for after register, still show result.
      localStorage.setItem("aluna-pending-answers", JSON.stringify(payload));
      const local = computeAssessment(payload);
      navigate("/result", { state: { result: local } });
    }
  }

  // ponytail: demo-only skip — fills all zeros, submits, goes straight home
  async function handleSkip() {
    const allZero = QUESTIONS.map(() => 0);
    setSubmitting(true);
    try {
      await apiFetch<SubmitResponse>("/api/assessment/submit", {
        method: "POST",
        body: { answers: allZero },
      });
    } catch {
      localStorage.setItem("aluna-pending-answers", JSON.stringify(allZero));
    }
    navigate("/");
  }

  function handleNext() {
    if (question.dimension === "safety") {
      if ((selected ?? 0) > 0) {
        navigate("/safety");
      } else {
        const full = [...answers, 0];
        // Submit (kalau login → API; kalau guest → simpan pending + result lokal)
        submitAll(full);
      }
      return;
    }
    if (index === total - 1) {
      submitAll();
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col bg-background px-6 py-6">
      <header>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            aria-label="Kembali ke pertanyaan sebelumnya"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assessment
            </p>
            <Progress value={((index + 1) / total) * 100} className="mt-2 h-1.5" />
          </div>
          <span className="text-xs font-semibold text-primary">
            {Math.round(((index + 1) / total) * 100)}%
          </span>
        </div>
      </header>

      <div className="mt-10 flex flex-1 flex-col gap-5">
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${DIM_TAG_STYLE[question.dimension]}`}
        >
          {DIMENSION_LABEL[question.dimension]}
        </span>
        <h1 className="font-serif text-2xl leading-snug">{question.text}</h1>
        <p className="text-sm text-muted-foreground">
          Jawab sejujurnya ya, ini bantu kami memahami kondisimu.
        </p>

        <div className="mt-2 flex flex-col gap-2.5" role="radiogroup" aria-label="Pilihan jawaban">
          {OPTIONS.map((option) => {
            const active = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => select(option.value)}
                className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 text-left transition-all active:scale-[0.98] ${
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? "border-primary" : "border-muted-foreground/40"
                  }`}
                  aria-hidden
                >
                  {active && <span className="size-2 rounded-full bg-primary" />}
                </span>
                <span className={`text-sm font-medium ${active ? "text-primary" : ""}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6">
          <Button
            onClick={handleNext}
            disabled={selected === undefined || submitting}
            className="h-12 w-full gap-2"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )}
            {submitting ? "Menyimpan…" : "Lanjut"}
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={submitting}
            className="mt-3 w-full text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
          >
            Lewati untuk demo →
          </button>
        </div>
      </div>
    </main>
  );
}
