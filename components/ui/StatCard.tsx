"use client";

import Link from "next/link";
import { useId, type ComponentType, type ReactNode } from "react";
import { cn } from "./cn";
import { dashboardCardLabelClass, dashboardCardValueClass } from "./styles";

type IconProps = { className?: string };

export type StatCardAccent = "cyan" | "electric" | "royal" | "navy" | "default";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ComponentType<IconProps>;
  footer?: ReactNode;
  href?: string;
  className?: string;
  /** Identité visuelle unique de la carte */
  accent?: StatCardAccent;
  /** Badge coloré (ex. tendance) */
  badge?: ReactNode;
  /** Mini courbe (valeurs relatives) */
  sparkline?: number[];
  /** Anneau de progression 0–100 */
  progress?: number;
};

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const uid = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const w = 120;
  const h = 32;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  const gradId = `spark-${uid}`;

  return (
    <svg className="dashboard-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <svg className="dashboard-progress-ring h-11 w-11 shrink-0" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(147,197,253,0.15)" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
      />
    </svg>
  );
}

const accentMeta: Record<
  StatCardAccent,
  { card: string; spark: string; ring: string }
> = {
  cyan: { card: "dashboard-stat-card--cyan", spark: "#0EA5E9", ring: "#0EA5E9" },
  electric: { card: "dashboard-stat-card--electric", spark: "#1A23FF", ring: "#1A23FF" },
  royal: { card: "dashboard-stat-card--royal", spark: "#2563EB", ring: "#2563EB" },
  navy: { card: "dashboard-stat-card--navy", spark: "#1E3A8A", ring: "#1E3A8A" },
  default: { card: "dashboard-stat-card--electric", spark: "#1A23FF", ring: "#1A23FF" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  footer,
  href,
  className,
  accent = "default",
  badge,
  sparkline,
  progress,
}: StatCardProps) {
  const meta = accentMeta[accent];

  const inner = (
    <div className="flex h-full min-h-0 flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <span className={dashboardCardLabelClass}>{label}</span>
          {badge ? <div className="pt-0.5">{badge}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          {typeof progress === "number" ? (
            <ProgressRing value={progress} color={meta.ring} />
          ) : null}
          <span className="dashboard-stat-icon">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </div>

      <div className={cn(dashboardCardValueClass, "leading-none")}>{value}</div>

      {sparkline && sparkline.length > 1 ? (
        <div className="mt-auto opacity-90">
          <Sparkline values={sparkline} stroke={meta.spark} />
        </div>
      ) : null}

      {footer ? (
        <div
          className={cn(
            "text-sm leading-relaxed text-[#A8B8D0]",
            sparkline && sparkline.length > 1 ? "pt-1" : "mt-auto pt-1"
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("dashboard-stat-card group block h-full min-h-0", meta.card, className)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn("dashboard-stat-card h-full min-h-0", meta.card, className)}>
      {inner}
    </div>
  );
}
