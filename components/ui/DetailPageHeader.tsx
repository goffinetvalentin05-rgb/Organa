"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type DetailPageHeaderProps = {
  backHref: string;
  backLabel: string;
  /**
   * Identifiant principal (ex. COT-2026-002) — reste sur une seule ligne.
   * Affiché en grand titre lorsqu’il est fourni.
   */
  reference?: string;
  /** Titre descriptif (ex. Cotisation annuelle…). */
  title?: ReactNode;
  /** Personne / entité concernée. */
  subject?: ReactNode;
  /** Ligne secondaire : dates, etc. */
  meta?: ReactNode;
  /** Badge ou libellé de statut (aligné sur la ligne méta). */
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * En-tête premium des pages de détail SaaS.
 * Hiérarchie : retour → référence → titre → sujet → méta/statut → actions.
 */
export default function DetailPageHeader({
  backHref,
  backLabel,
  reference,
  title,
  subject,
  meta,
  status,
  actions,
  className,
}: DetailPageHeaderProps) {
  const hasReference = Boolean(reference);
  const hasTitle = title != null && title !== "";

  return (
    <header className={cn("w-full min-w-0", className)}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A23FF]"
      >
        ← {backLabel}
      </Link>

      <div className="mt-5 min-w-0 sm:mt-6">
        {hasReference ? (
          <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.75rem] font-semibold tracking-[-0.03em] text-[#0F172A] sm:text-[2rem] md:text-[2.25rem]">
            {reference}
          </h1>
        ) : null}

        {hasTitle ? (
          <p
            className={cn(
              "max-w-4xl font-semibold tracking-[-0.025em] text-[#0F172A]",
              hasReference
                ? "mt-2 text-[1.25rem] leading-snug sm:text-[1.45rem] md:text-[1.6rem]"
                : "text-[1.75rem] leading-tight sm:text-[2rem] md:text-[2.25rem]",
            )}
          >
            {title}
          </p>
        ) : null}

        {subject ? (
          <p className="mt-4 text-base font-medium text-[#0F172A] sm:mt-5 sm:text-[1.0625rem]">
            {subject}
          </p>
        ) : null}

        {(meta || status) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-[#64748B] sm:text-[0.9375rem]">
            {meta ? <div className="min-w-0">{meta}</div> : null}
            {meta && status ? (
              <span className="hidden text-[#CBD5E1] sm:inline" aria-hidden>
                •
              </span>
            ) : null}
            {status ? <div className="shrink-0">{status}</div> : null}
          </div>
        )}
      </div>

      {actions ? (
        <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-8 sm:gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
