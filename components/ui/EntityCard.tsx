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
   * `row` = carte horizontale pleine largeur (listes finances).
   */
  layout?: "stack" | "row";
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
}: EntityCardProps) {
  const isRow = layout === "row";

  const titleNode = (
    <h3
      className={cn(
        "font-semibold tracking-tight text-[#0F172A] text-balance",
        isRow ? "text-[0.975rem] sm:text-base" : "text-base",
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
          className="rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1A23FF]"
        >
          {titleNode}
        </Link>
      ) : (
        titleNode
      )}
      {subtitle ? (
        <p className="mt-0.5 text-sm leading-snug text-[#64748B]">{subtitle}</p>
      ) : null}
      {badges ? <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div> : null}
    </div>
  );

  if (isRow) {
    return (
      <article
        className={cn(
          dashboardGlassCardClass,
          "group/entity px-4 py-4 transition-all duration-250 sm:px-5 sm:py-4",
          "hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
          className,
        )}
      >
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-3.5">
            {leading ? <div className="shrink-0">{leading}</div> : null}
            {titleBlock}
            {status ? <div className="shrink-0 lg:hidden">{status}</div> : null}
          </div>

          {(meta || children) && (
            <div className="min-w-0 flex-1 space-y-1 text-sm text-[#64748B] lg:max-w-[18rem] xl:max-w-[22rem]">
              {meta}
              {children}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:shrink-0 lg:justify-end">
            {amount ? (
              <div className="text-lg font-semibold tracking-tight tabular-nums text-[#0F172A] sm:text-xl">
                {amount}
              </div>
            ) : null}
            {status ? <div className="hidden shrink-0 lg:block">{status}</div> : null}
            {actions ? (
              <div
                className="flex flex-wrap items-center gap-2 border-t border-[rgba(15,23,42,0.06)] pt-3 sm:border-0 sm:pt-0 lg:pl-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {actions}
              </div>
            ) : null}
          </div>
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

/** Liste verticale de cartes horizontales — modules finances. */
export function EntityCardList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-3 sm:gap-3.5", className)}>{children}</div>;
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
      <p className="truncate text-sm text-[#64748B]">
        <span className="font-medium text-[#94A3B8]">{label} · </span>
        <span className="text-[#475569]">{value}</span>
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
