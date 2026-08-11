import { useState } from "react";
import { Check, Flag, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneyMapProps {
  /** Titik saat ini, 1–6 */
  current: number;
  /** Nomor titik yang sudah diselesaikan */
  done?: number[];
  /** Label per titik (opsional, panjang 6) */
  labels?: string[];
  className?: string;
}

const VIEW_W = 390;
const VIEW_H = 430;

const MILESTONES = [
  { x: 55, y: 398 },
  { x: 130, y: 332 },
  { x: 150, y: 202 },
  { x: 250, y: 207 },
  { x: 300, y: 172 },
  { x: 337, y: 147 },
];

// Path data asli dari mockup s8 (baris 325-328). Hijau = sudah dilalui (end <= current).
const SEGMENTS = [
  { d: "M55 398 Q110 365 130 332 Q150 295 120 262", end: 2 },
  { d: "M120 262 Q95 228 150 202", end: 3 },
  { d: "M150 202 Q210 172 250 207 Q295 247 300 172", end: 5 },
  { d: "M300 172 Q315 158 335 162", end: 6 },
];

const DEFAULT_LABELS = [
  "Mulai perjalanan",
  "Kenali dirimu",
  "Konseling pertama",
  "Ritme harian baru",
  "Bangun kebiasaan",
  "Tujuan tercapai",
];

function pin(r: number, top: number) {
  return `M 0 0 C ${-r} ${top * 0.55} ${-r} ${top} 0 ${top} C ${r} ${top} ${r} ${top * 0.55} 0 0 Z`;
}

export default function JourneyMap({
  current,
  done = [],
  labels,
  className,
}: JourneyMapProps) {
  const [active, setActive] = useState<number | null>(null);
  const completed = new Set(done);
  for (let n = 1; n < current; n++) completed.add(n);

  const allLabels = labels
    ? MILESTONES.map((_, i) => labels[i] ?? DEFAULT_LABELS[i] ?? `Titik ${i + 1}`)
    : DEFAULT_LABELS;
  const currentLabel = allLabels[current - 1];
  const ariaLabel = currentLabel
    ? `Peta perjalananmu: langkah ${current} dari 6 — ${currentLabel}`
    : `Peta perjalananmu: langkah ${current} dari 6`;

  // Bubble info muncul tepat di atas pin yang dipilih (koordinat → persen)
  const activeM = active != null ? MILESTONES[active - 1] : null;
  const bubbleLeft = activeM ? `${(activeM.x / VIEW_W) * 100}%` : "50%";
  const bubbleTop = activeM ? `${Math.max((activeM.y / VIEW_H) * 100 - 16, 2)}%` : "8%";

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={ariaLabel}
        className="block size-full"
      >
        <defs>
          <linearGradient id="jm-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EAF4EC" />
            <stop offset="1" stopColor="#F4F1E8" />
          </linearGradient>
          <linearGradient id="jm-land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#CDE8D4" />
            <stop offset="1" stopColor="#A9D6B6" />
          </linearGradient>
          <linearGradient id="jm-wtr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#BEE4E6" />
            <stop offset="1" stopColor="#8FCACF" />
          </linearGradient>
          <radialGradient id="jm-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#F7DE8A" stopOpacity="0.9" />
            <stop offset="1" stopColor="#F7DE8A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Landscape dekoratif */}
        <g aria-hidden>
          <rect width="390" height="430" fill="url(#jm-sky)" />
          <circle cx="330" cy="58" r="78" fill="url(#jm-glow)" />
          <circle cx="330" cy="58" r="19" fill="#F4D06F" opacity="0.85" />
          <g fill="#fff" opacity="0.75">
            <ellipse cx="80" cy="44" rx="25" ry="9" />
            <ellipse cx="98" cy="39" rx="17" ry="8" />
            <ellipse cx="248" cy="33" rx="21" ry="8" />
          </g>
          <path d="M0 148 L55 76 L100 128 L150 68 L210 143 Z" fill="#CBDDD3" />
          <path d="M40 148 L95 93 L140 148 Z" fill="#B7D2C2" />
          <path d="M138 82 L150 68 L163 86 L155 82 L148 88 L142 83 Z" fill="#F4F9F6" />
          <path d="M0 148 Q90 118 180 148 T390 138 L390 430 L0 430 Z" fill="url(#jm-land)" />
          <path
            d="M300 148 Q250 208 300 268 Q350 318 290 375 Q250 408 320 430"
            fill="none"
            stroke="url(#jm-wtr)"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.9"
          />
          <ellipse cx="55" cy="398" rx="58" ry="28" fill="url(#jm-wtr)" />
          <g>
            <g transform="translate(120,246)">
              <rect x="-2" y="8" width="4" height="10" fill="#8a6a4a" />
              <circle cx="0" cy="2" r="11" fill="#67B183" />
              <circle cx="-5" cy="6" r="8" fill="#7BBE92" />
              <circle cx="6" cy="6" r="8" fill="#5CA778" />
            </g>
            <g transform="translate(95,296)">
              <rect x="-2" y="7" width="4" height="9" fill="#8a6a4a" />
              <circle cx="0" cy="0" r="9" fill="#5CA778" />
            </g>
            <g transform="translate(230,315)">
              <rect x="-2" y="8" width="4" height="10" fill="#8a6a4a" />
              <circle cx="0" cy="1" r="10" fill="#67B183" />
              <circle cx="-5" cy="5" r="7" fill="#7BBE92" />
            </g>
            <g transform="translate(60,246)">
              <rect x="-1.5" y="6" width="3" height="8" fill="#8a6a4a" />
              <path d="M0 -10 L8 6 L-8 6 Z" fill="#5CA778" />
            </g>
          </g>
          <g transform="translate(340,172)">
            <ellipse cx="0" cy="26" rx="25" ry="8" fill="#B7D2C2" />
            <path d="M-8 24 L-6 -14 L6 -14 L8 24 Z" fill="#F4F1E8" />
            <rect x="-6" y="-4" width="12" height="7" fill="#E8A87C" />
            <rect x="-6" y="10" width="12" height="7" fill="#E8A87C" />
            <path d="M-6 -14 L6 -14 L4 -22 L-4 -22 Z" fill="#5C6B62" />
            <circle cx="0" cy="-18" r="3" fill="#F7DE8A" />
            <path d="M3 -19 L14 -24 M3 -17 L14 -12" stroke="#F7DE8A" strokeWidth="1.5" opacity="0.8" />
          </g>
        </g>

        {SEGMENTS.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="1 9"
            className={s.end <= current ? "stroke-primary" : "stroke-muted-foreground/40"}
          />
        ))}

        {MILESTONES.map((m, i) => {
          const n = i + 1;
          const isDone = completed.has(n);
          const isCurrent = n === current;
          const isFinish = n === MILESTONES.length;
          const isSelected = active === n;
          const big = isSelected || isCurrent;
          const top = isCurrent ? -32 : -28;
          const iconCy = isCurrent ? top * 0.65 : top * 0.68;

          return (
            <g
              key={n}
              transform={`translate(${m.x} ${m.y})`}
              onClick={() => setActive((a) => (a === n ? null : n))}
              className="cursor-pointer transition-transform duration-150 [&:hover]:scale-110"
              role="button"
              aria-label={`${isDone ? "Selesai: " : ""}${allLabels[n - 1] ?? `Titik ${n}`}`}
              aria-expanded={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive((a) => (a === n ? null : n));
                }
              }}
            >
              {isCurrent && !isSelected && (
                <circle cx="0" cy={iconCy} r="13" fill="var(--color-accent)" opacity="0.35" />
              )}
              <path
                d={pin(big ? 16 : 13, top)}
                fill={
                  isSelected
                    ? "var(--color-primary)"
                    : isCurrent
                      ? "var(--color-accent)"
                      : isDone
                        ? "var(--color-primary)"
                        : isFinish
                          ? "var(--color-accent)"
                          : "var(--color-muted)"
                }
                stroke={isDone || isCurrent || isFinish ? "none" : "var(--color-muted-foreground)"}
                strokeOpacity={isDone || isCurrent || isFinish ? undefined : 0.4}
              />
              {isFinish ? (
                <>
                  <circle cx="0" cy={iconCy} r="7" fill="#fff" />
                  <Flag
                    width={11}
                    height={11}
                    x={-5.5}
                    y={iconCy - 5.5}
                    strokeWidth={2.5}
                    className="text-foreground"
                  />
                </>
              ) : isCurrent ? (
                <MapPin
                  width={19}
                  height={19}
                  x={-9.5}
                  y={iconCy - 8.5}
                  strokeWidth={2}
                  className="text-accent-foreground"
                />
              ) : isDone ? (
                <>
                  <circle cx="0" cy={iconCy} r="7.5" fill="var(--color-primary-foreground)" />
                  <Check
                    width={11}
                    height={11}
                    x={-5.5}
                    y={iconCy - 5.5}
                    strokeWidth={2.5}
                    className="text-primary"
                  />
                </>
              ) : (
                <>
                  <circle cx="0" cy={iconCy} r="7" fill="#fff" />
                  <text
                    x="0"
                    y={iconCy + 2.7}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="700"
                    fill="#93A099"
                  >
                    {n}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Bubble info titik yang diklik — muncul tepat di atas pin, dengan tombol close */}
      {active != null && activeM && (
        <div
          role="dialog"
          aria-label={`Info ${allLabels[active - 1]}`}
          className="absolute z-20 -translate-x-1/2 rounded-xl bg-background p-3 shadow-lg ring-1 ring-foreground/10"
          style={{ left: bubbleLeft, top: bubbleTop }}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="size-3.5" aria-hidden />
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            {completed.has(active) ? "Selesai" : active === current ? "Kamu di sini" : active === MILESTONES.length ? "Tujuan" : `Titik ${active}`}
          </p>
          <p className="mt-0.5 pr-5 text-sm font-bold">{allLabels[active - 1]}</p>
        </div>
      )}
    </div>
  );
}
