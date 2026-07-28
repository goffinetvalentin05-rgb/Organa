"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { UserCheck, ArrowRight, Shield } from "@/lib/icons";
import { cn, dashboardGlassCardClass } from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";

interface UsersAccessCardProps {
  canManageTeamAccess: boolean;
  loading?: boolean;
}

export default function UsersAccessCard({
  canManageTeamAccess,
  loading = false,
}: UsersAccessCardProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className={cn(dashboardGlassCardClass, "animate-pulse p-6 sm:p-7")}>
        <div className="h-24 rounded-2xl bg-[#F1F5F9]" />
      </div>
    );
  }

  if (canManageTeamAccess) {
    return (
      <Link href="/tableau-de-bord/parametres/utilisateurs" className="group block">
        <TeamCardSurface>
          <TeamCardContent t={t} locked={false} />
        </TeamCardSurface>
      </Link>
    );
  }

  return (
    <Link href="/tableau-de-bord/abonnement" className="group block">
      <TeamCardSurface locked>
        <TeamCardContent t={t} locked />
      </TeamCardSurface>
    </Link>
  );
}

function TeamCardSurface({
  children,
  locked = false,
}: {
  children: ReactNode;
  locked?: boolean;
}) {
  return (
    <div
      className={cn(
        dashboardGlassCardClass,
        "p-6 transition-all duration-300 ease-out sm:p-7",
        "hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.22)]",
        locked
          ? "hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
          : "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(26,35,255,0.06)] hover:shadow-[0_8px_28px_rgba(26,35,255,0.12),0_0_0_1px_rgba(26,35,255,0.08)] before:pointer-events-none before:absolute before:-inset-px before:rounded-[1.25rem] before:bg-[radial-gradient(ellipse_at_top_right,rgba(26,35,255,0.12),transparent_55%)] before:opacity-80 before:transition-opacity before:duration-300 group-hover:before:opacity-100",
      )}
    >
      {children}
    </div>
  );
}

function TeamCardContent({
  t,
  locked,
}: {
  t: (key: string) => string;
  locked: boolean;
}) {
  return (
    <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 items-start gap-4 sm:gap-5">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-[3.75rem] sm:w-[3.75rem]",
            locked
              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              : "bg-gradient-to-br from-[#4F57FF] via-[#1A23FF] to-[#151dd9] text-white shadow-[0_6px_20px_rgba(26,35,255,0.28)] ring-1 ring-[rgba(26,35,255,0.2)]",
          )}
        >
          {locked ? <Shield className="h-7 w-7" /> : <UserCheck className="h-7 w-7" />}
        </div>
        <div className="min-w-0 pt-0.5">
          {locked ? (
            <span className="mb-2.5 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {t("dashboard.settings.usersAccessLocked.badge")}
            </span>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight text-[#0F172A] sm:text-xl">
            {t("dashboard.settings.layout.sections.usersAccess")}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm font-normal leading-relaxed text-[#64748B] sm:text-[0.9375rem]">
            {locked
              ? t("dashboard.settings.usersAccessLocked.description")
              : t("dashboard.settings.layout.usersAccess.description")}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-250 sm:py-3",
          locked
            ? "border border-[rgba(15,23,42,0.1)] bg-[#F8FAFC] text-[#334155] group-hover:border-[rgba(26,35,255,0.16)] group-hover:bg-white"
            : "bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#151dd9] text-white shadow-[0_4px_14px_rgba(26,35,255,0.28)] group-hover:shadow-[0_6px_18px_rgba(26,35,255,0.35)] group-hover:opacity-[0.97]",
        )}
      >
        {locked
          ? t("dashboard.settings.usersAccessLocked.cta")
          : t("dashboard.settings.layout.usersAccess.cta")}
        <ArrowRight className="h-4 w-4 transition-transform duration-250 group-hover:translate-x-0.5" />
      </span>
    </div>
  );
}
