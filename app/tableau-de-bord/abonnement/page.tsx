"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function AbonnementPage() {
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
        <h1 className="text-3xl font-bold">Abonnement</h1>
        <p className="mt-2 text-white/70">Gérez votre abonnement et vos limites</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C5CFF]"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Gratuit */}
          <div
            className={`rounded-2xl border-2 p-6 ${
              userPlan === "free"
                ? "border-[#7C5CFF] bg-gradient-to-br from-[#7C5CFF]/10 to-[#8B5CF6]/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Plan Gratuit</h2>
              {userPlan === "free" && (
                <span className="px-3 py-1 rounded-full bg-[#7C5CFF] text-white text-sm font-medium">
                  Actuel
                </span>
              )}
            </div>
            <p className="text-white/70 mb-6">Idéal pour démarrer</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5"
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
                <span className="text-white/90">Maximum 2 clients</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5"
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
                <span className="text-white/90">Maximum 3 documents par mois</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5"
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
                <span className="text-white/90">Toutes les fonctionnalités de base</span>
              </li>
            </ul>
          </div>

          {/* Plan Pro */}
          <div
            className={`rounded-2xl border-2 p-6 ${
              userPlan === "pro"
                ? "border-[#7C5CFF] bg-gradient-to-br from-[#7C5CFF]/10 to-[#8B5CF6]/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Plan Pro</h2>
              {userPlan === "pro" && (
                <span className="px-3 py-1 rounded-full bg-[#7C5CFF] text-white text-sm font-medium">
                  Actuel
                </span>
              )}
            </div>
            <p className="text-white/70 mb-6">Accès illimité</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5"
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
                <span className="text-white/90">Clients illimités</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5"
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
                <span className="text-white/90">Documents illimités</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5"
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
                <span className="text-white/90">Support prioritaire</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5"
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
                <span className="text-white/90">Toutes les fonctionnalités</span>
              </li>
            </ul>
            {userPlan === "free" && (
              <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/70 mb-3">
                  Le paiement sera bientôt disponible. Pour le moment, profitez du plan gratuit !
                </p>
                <Link
                  href="/tableau-de-bord/parametres"
                  className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
                >
                  Retour aux paramètres
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}























