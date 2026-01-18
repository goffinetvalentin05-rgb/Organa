"use client";

import Link from "next/link";

interface LimitReachedAlertProps {
  message: string;
  resource?: "clients" | "documents";
}

/**
 * Composant réutilisable pour afficher un message d'erreur LIMIT_REACHED
 * Redirige vers /tableau-de-bord/abonnement
 */
export default function LimitReachedAlert({ message, resource }: LimitReachedAlertProps) {
  return (
    <div className="rounded-xl border-2 border-[#7C5CFF]/50 bg-gradient-to-r from-[#7C5CFF]/10 to-[#8B5CF6]/10 p-6 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-[#7C5CFF]"
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
          <h3 className="text-lg font-semibold text-white mb-2">
            Limite du plan gratuit atteinte
          </h3>
          <p className="text-white/80 mb-4">{message}</p>
          <Link
            href="/tableau-de-bord/abonnement"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
          >
            Voir les offres
            <svg
              className="w-4 h-4"
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
























