"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCheck, ArrowRight, Shield } from "@/lib/icons";
import { GlassCard } from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import TeamUpgradeModal from "./TeamUpgradeModal";

interface UsersAccessCardProps {
  canManageTeamAccess: boolean;
  loading?: boolean;
}

export default function UsersAccessCard({
  canManageTeamAccess,
  loading = false,
}: UsersAccessCardProps) {
  const { t } = useI18n();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (loading) {
    return (
      <GlassCard padding="lg" className="animate-pulse">
        <div className="h-20 rounded-xl bg-white/10" />
      </GlassCard>
    );
  }

  if (canManageTeamAccess) {
    return (
      <Link href="/tableau-de-bord/parametres/utilisateurs" className="group block">
        <GlassCard
          padding="lg"
          className="transition-all duration-200 hover:border-white/30 hover:bg-white/[0.14] hover:shadow-md hover:shadow-blue-950/15"
        >
          <TeamCardContent t={t} locked={false} />
        </GlassCard>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setUpgradeOpen(true)}
        className="group block w-full text-left"
      >
        <GlassCard
          padding="lg"
          className="transition-all duration-200 hover:border-white/30 hover:bg-white/[0.14] hover:shadow-md hover:shadow-blue-950/15"
        >
          <TeamCardContent t={t} locked />
        </GlassCard>
      </button>
      <TeamUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${
            locked
              ? "bg-white/10 text-white/70 shadow-none ring-1 ring-white/20"
              : "bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-blue-900/35"
          }`}
        >
          {locked ? <Shield className="h-6 w-6" /> : <UserCheck className="h-6 w-6" />}
        </div>
        <div className="min-w-0">
          {locked && (
            <span className="mb-2 inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
              {t("dashboard.settings.usersAccessLocked.badge")}
            </span>
          )}
          <h2 className="text-lg font-bold text-white drop-shadow-sm">
            {t("dashboard.settings.layout.sections.usersAccess")}
          </h2>
          <p className="mt-1 text-sm font-medium leading-relaxed text-white/75">
            {locked
              ? t("dashboard.settings.usersAccessLocked.description")
              : t("dashboard.settings.layout.usersAccess.description")}
          </p>
        </div>
      </div>
      <span
        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition sm:py-2.5 ${
          locked
            ? "border-white/25 bg-white/10 text-white group-hover:bg-white/15"
            : "border-white/30 bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-900/25 group-hover:opacity-95"
        }`}
      >
        {locked
          ? t("dashboard.settings.usersAccessLocked.cta")
          : t("dashboard.settings.layout.usersAccess.cta")}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  );
}
