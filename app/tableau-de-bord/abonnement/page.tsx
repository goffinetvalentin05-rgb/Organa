"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";

export default function AbonnementPage() {
  const { t } = useI18n();
  const [userPlan, setUserPlan] = useState<"free" | "pro" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data.user?.plan || "free");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du plan", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.subscription.title")}</h1>
        <p className="mt-2 text-secondary">{t("dashboard.subscription.subtitle")}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 accent-border-strong"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Gratuit */}
          <div
            className={`rounded-2xl border-2 p-6 ${
              userPlan === "free"
                ? "accent-border-strong bg-surface"
                : "border-subtle bg-surface"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{t("dashboard.subscription.free.title")}</h2>
              {userPlan === "free" && (
                <span className="px-3 py-1 rounded-full accent-bg text-white text-sm font-medium">
                  {t("dashboard.subscription.current")}
                </span>
              )}
            </div>
            <p className="text-secondary mb-6">{t("dashboard.subscription.free.subtitle")}</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 accent flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-primary">{t("dashboard.subscription.free.features.clients")}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 accent flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-primary">{t("dashboard.subscription.free.features.documents")}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 accent flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-primary">{t("dashboard.subscription.free.features.core")}</span>
              </li>
            </ul>
          </div>

          {/* Plan Pro */}
          <div
            className={`rounded-2xl border-2 p-6 ${
              userPlan === "pro"
                ? "accent-border-strong bg-surface"
                : "border-subtle bg-surface"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{t("dashboard.subscription.pro.title")}</h2>
              {userPlan === "pro" && (
                <span className="px-3 py-1 rounded-full accent-bg text-white text-sm font-medium">
                  {t("dashboard.subscription.current")}
                </span>
              )}
            </div>
            <p className="text-secondary mb-6">{t("dashboard.subscription.pro.subtitle")}</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 accent flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-primary">{t("dashboard.subscription.pro.features.clients")}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 accent flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-primary">{t("dashboard.subscription.pro.features.documents")}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 accent flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-primary">{t("dashboard.subscription.pro.features.support")}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 accent flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-primary">{t("dashboard.subscription.pro.features.all")}</span>
              </li>
            </ul>
            {userPlan === "free" && (
              <div className="mt-6 p-4 rounded-lg bg-surface border border-subtle">
                <p className="text-sm text-secondary mb-3">
                  {t("dashboard.subscription.pro.notice")}
                </p>
                <Link
                  href="/tableau-de-bord/parametres"
                  className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg accent-bg text-white font-medium transition-all"
                >
                  {t("dashboard.subscription.pro.cta")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



























