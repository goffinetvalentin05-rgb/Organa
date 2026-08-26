"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { dashboardGlassCardClass } from "./styles";

export type EntityCardProps = {
  /** Lien principal de la carte (titre / zone contenu). */
  href?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Avatar ou icône en tête de carte. */
  leading?: ReactNode;
  badges?: ReactNode;
  /** Infos secondaires (email, date, etc.). */
  meta?: ReactNode;
  /** Montant mis en avant (factures, cotisations…). */
  amount?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
  /**
   * `stack` = carte verticale (grille).
   * `row` = carte horizontale pleine largeur (listes).
   */
  layout?: "stack" | "row";
  /** Clic sur la ligne (hors actions). */
  onClick?: () => void;
};

/**
 * Carte d’entité dashboard — remplace les lignes de liste / tableaux Excel.
 */
export default function EntityCard({
  href,
  title,
  subtitle,
  leading,
  badges,
  meta,
  amount,
  status,
  actions,
  className,
  children,
  layout = "stack",
  onClick,
}: EntityCardProps) {
  const isRow = layout === "row";

  const titleNode = (
    <h3
      className={cn(
        "font-semibold tracking-tight text-[#0F172A]",
        isRow ? "text-[0.975rem] sm:text-base" : "text-base text-balance",
        href && "transition-colors group-hover/entity:text-[#1A23FF]",
      )}
    >
      {title}
    </h3>
  );

  const titleBlock = (
    <div className="min-w-0 flex-1">
      {href ? (
        <Link
          href={href}
          className="block min-w-0 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1A23FF]"
        >
          {titleNode}
        </Link>
      ) : (
        titleNode
      )}
      {subtitle ? (
        <p
          className={cn(
            "mt-0.5 text-sm leading-snug text-[#64748B]",
            isRow && "line-clamp-2",
          )}
        >
          {subtitle}
        </p>
      ) : null}
      {badges ? (
        <div className={cn("flex flex-wrap gap-1.5", isRow ? "mt-1" : "mt-2")}>{badges}</div>
      ) : null}
    </div>
  );

  if (isRow) {
    const hasMeta = Boolean(meta || children);
    const hasAside = Boolean(amount || status);
    const rowGridClass = hasMeta
      ? hasAside
        ? "lg:grid-cols-[minmax(0,1.2fr)_16rem_9.25rem_minmax(11rem,0.95fr)] xl:grid-cols-[minmax(0,1.25fr)_18rem_10.5rem_minmax(13rem,0.9fr)]"
        : "lg:grid-cols-[minmax(0,1.3fr)_16rem_minmax(11rem,0.95fr)] xl:grid-cols-[minmax(0,1.35fr)_18rem_minmax(13rem,0.9fr)]"
      : hasAside
        ? "lg:grid-cols-[minmax(0,1.3fr)_9.25rem_minmax(11rem,0.95fr)] xl:grid-cols-[minmax(0,1.35fr)_10.5rem_minmax(13rem,0.9fr)]"
        : "lg:grid-cols-[minmax(0,1fr)_minmax(11rem,0.9fr)] xl:grid-cols-[minmax(0,1fr)_minmax(13rem,0.85fr)]";

    return (
      <article
        onClick={onClick}
        className={cn(
          "group/entity relative overflow-hidden rounded-xl border border-[rgba(15,23,42,0.08)] bg-white text-[#0F172A]",
          "px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_rgba(15,23,42,0.04)] sm:px-5",
          "transition-[border-color,box-shadow] duration-200",
          "hover:border-[rgba(26,35,255,0.14)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]",
          onClick && "cursor-pointer",
          className,
        )}
      >
        <div className={cn("grid grid-cols-1 items-start gap-3 lg:gap-x-5 lg:gap-y-0", rowGridClass)}>
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            {leading ? <div className="shrink-0">{leading}</div> : null}
            {titleBlock}
          </div>

          {hasMeta ? (
            <div className="min-w-0 w-full">
              <div className="space-y-0.5 text-sm text-[#64748B]">{meta}{children}</div>
            </div>
          ) : null}

          {hasAside ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 lg:flex-col lg:items-end lg:gap-1">
              {amount ? (
                <div className="text-base font-semibold tracking-tight tabular-nums text-[#0F172A] sm:text-lg lg:w-full lg:text-right">
                  {amount}
                </div>
              ) : null}
              {status ? <div className="shrink-0 lg:max-w-full">{status}</div> : null}
            </div>
          ) : null}

          {actions ? (
            <div
              className="flex min-w-0 flex-wrap items-center gap-2 border-t border-[rgba(15,23,42,0.06)] pt-3 sm:border-0 sm:pt-0 lg:justify-end"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        dashboardGlassCardClass,
        "group/entity flex h-full flex-col p-5 transition-all duration-250 sm:p-6",
        "hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {leading ? <div className="shrink-0">{leading}</div> : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            {titleBlock}
            {status ? <div className="shrink-0">{status}</div> : null}
          </div>
        </div>
      </div>

      {amount ? (
        <div className="mt-4 text-[1.35rem] font-semibold tracking-tight tabular-nums text-[#0F172A] sm:text-[1.5rem]">
          {amount}
        </div>
      ) : null}

      {meta ? (
        <div className="mt-3 space-y-1.5 text-sm text-[#64748B]">{meta}</div>
      ) : null}

      {children ? <div className="mt-3">{children}</div> : null}

      {actions ? (
        <div
          className="mt-auto flex flex-wrap items-center gap-2 border-t border-[rgba(15,23,42,0.06)] pt-4"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </article>
  );
}

export type EntityCardGridProps = {
  children: ReactNode;
  className?: string;
  /** Densité : 2 / 3 colonnes max selon l’espace. */
  columns?: 2 | 3;
};

export function EntityCardGrid({ children, className, columns = 3 }: EntityCardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5",
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Liste verticale de cartes horizontales — pages de listing dashboard. */
export function EntityCardList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-2.5 sm:gap-3", className)}>{children}</div>;
}

/** Avatar initiales premium pour les cartes membres / contacts. */
export function EntityAvatar({
  label,
  className,
  size = "md",
}: {
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const initial = (label || "?").charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl font-bold text-white shadow-[0_8px_18px_rgba(26,35,255,0.22)]",
        size === "sm"
          ? "h-11 w-11 rounded-xl text-base"
          : "h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl",
        className,
      )}
      style={{
        background: "linear-gradient(145deg, #3B82F6 0%, #1A23FF 55%, #102d78 100%)",
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

/** Ligne méta discrète (label + valeur). */
export function EntityMetaRow({
  label,
  value,
  inline = false,
}: {
  label: string;
  value: ReactNode;
  /** Mode compact pour cartes horizontales. */
  inline?: boolean;
}) {
  if (inline) {
    return (
      <p className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-start gap-x-2 text-sm leading-5">
        <span className="font-medium text-[#94A3B8]">{label}</span>
        <span className="min-w-0 break-words tabular-nums text-[#475569]">{value}</span>
      </p>
    );
  }

  return (
    <p className="flex items-baseline gap-2">
      <span className="w-[4.5rem] shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
        {label}
      </span>
      <span className="min-w-0 truncate text-[#475569]">{value}</span>
    </p>
  );
}
