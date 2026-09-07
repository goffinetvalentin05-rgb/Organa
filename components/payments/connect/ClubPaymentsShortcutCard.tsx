"use client";

import Link from "next/link";
import { ArrowRight, CreditCard } from "@/lib/icons";
import { cn, dashboardGlassCardClass } from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";

export default function ClubPaymentsShortcutCard() {
  const { t } = useI18n();

  return (
    <Link href="/tableau-de-bord/compte-de-paiement" className="group block">
      <div
        className={cn(
          dashboardGlassCardClass,
          "p-6 transition-all duration-300 ease-out sm:p-7",
          "hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.22)]",
          "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(26,35,255,0.06)] hover:shadow-[0_8px_28px_rgba(26,35,255,0.12),0_0_0_1px_rgba(26,35,255,0.08)]"
        )}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[rgba(26,35,255,0.08)] text-[#1A23FF] sm:h-[3.75rem] sm:w-[3.75rem]">
              <CreditCard className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-[#0F172A] sm:text-xl">
                {t("dashboard.paymentAccount.shortcutTitle")}
              </h2>
              <p className="mt-1.5 max-w-xl text-sm font-normal leading-relaxed text-[#64748B] sm:text-[0.9375rem]">
                {t("dashboard.paymentAccount.shortcutBody")}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A23FF]">
            {t("dashboard.paymentAccount.shortcutCta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
