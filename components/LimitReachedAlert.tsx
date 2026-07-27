"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

interface LimitReachedAlertProps {
  message: string;
  resource?: "clients" | "documents";
}

/**
 * Composant réutilisable pour afficher un message d'erreur LIMIT_REACHED
 * Redirige vers /tableau-de-bord/abonnement
 */
export default function LimitReachedAlert({ message }: LimitReachedAlertProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-violet-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-[#0F172A]">
            {t("dashboard.limits.title")}
          </h3>
          <p className="mb-4 text-[#475569]">{message}</p>
          <Link
            href="/tableau-de-bord/abonnement"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] px-6 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-violet-200"
          >
            {t("dashboard.limits.cta")}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
