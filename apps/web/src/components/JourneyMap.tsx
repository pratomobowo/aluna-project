import { Check, Flag, MapPin } from "lucide-react";
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

const MILESTONES = [
  { x: 55, y: 398 },
  { x: 130, y: 332 },
  { x: 150, y: 202 },
  { x: 250, y: 207 },
  { x: 300, y: 172 },
  { x: 337, y: 147 },
];

// SEGMENTS[i] berjalan dari milestone i+1 ke milestone i+2
const SEGMENTS = [
  "M 55 398 C 100 385 95 345 130 332",
  "M 130 332 C 150 310 125 270 150 202",
  "M 150 202 C 175 175 225 175 250 207",
  "M 250 207 C 265 230 285 205 300 172",
  "M 300 172 C 312 155 320 150 337 147",
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
  const completed = new Set(done);
  const currentLabel = labels?.[current - 1];
  const ariaLabel = currentLabel
    ? `Peta perjalananmu: langkah ${current} dari 6 — ${currentLabel}`
    : `Peta perjalananmu: langkah ${current} dari 6`;

  return (
    <svg viewBox="0 0 390 430" role="img" aria-label={ariaLabel} className={cn("size-full", className)}>
      <defs>
        <linearGradient id="jm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-muted)" />
          <stop offset="1" stopColor="var(--color-background)" />
        </linearGradient>
      </defs>
      <rect width="390" height="430" rx="22" fill="url(#jm-sky)" />
      {SEGMENTS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="1 9"
          className={i + 2 <= current ? "stroke-primary" : "stroke-muted-foreground/40"}
        />
      ))}
      {MILESTONES.map((m, i) => {
        const n = i + 1;
        const isDone = completed.has(n) || n < current;
        const isCurrent = n === current;
        const isFinish = n === MILESTONES.length;
        const top = isCurrent ? -30 : -26;
        const iconCy = isCurrent ? top * 0.65 : top * 0.68;

        return (
          <g key={n} transform={`translate(${m.x} ${m.y})`}>
            {isCurrent && (
              <circle className="jm-pulse" cx="0" cy={iconCy} r="17" fill="var(--color-accent)" />
            )}
            <path
              d={pin(isCurrent ? 15 : 12, top)}
              fill={
                isCurrent
                  ? "var(--color-accent)"
                  : isDone
                    ? "var(--color-primary)"
                    : "var(--color-muted)"
              }
              stroke={isDone || isCurrent ? "none" : "var(--color-muted-foreground)"}
              strokeOpacity={isDone || isCurrent ? undefined : 0.4}
            />
            {isDone && (
              <circle cx="0" cy={iconCy} r="7" fill="var(--color-primary-foreground)" />
            )}
            {isFinish ? (
              <Flag
                width={isCurrent ? 20 : 13}
                height={isCurrent ? 20 : 13}
                x={isCurrent ? -10 : -6.5}
                y={isCurrent ? iconCy - 10 : iconCy - 6.5}
                strokeWidth={2.2}
                className={
                  isCurrent
                    ? "text-accent-foreground"
                    : isDone
                      ? "text-primary"
                      : "text-muted-foreground"
                }
              />
            ) : isCurrent ? (
              <MapPin
                width={18}
                height={18}
                x={-9}
                y={iconCy - 8}
                strokeWidth={2}
                className="text-accent-foreground"
              />
            ) : isDone ? (
              <Check
                width={11}
                height={11}
                x={-5.5}
                y={iconCy - 5.5}
                strokeWidth={2.5}
                className="text-primary"
              />
            ) : (
              <MapPin
                width={12}
                height={12}
                x={-6}
                y={iconCy - 6}
                strokeWidth={2}
                className="text-muted-foreground"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
