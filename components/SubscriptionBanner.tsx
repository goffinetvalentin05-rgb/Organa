"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Types pour le statut d'abonnement
interface SubscriptionInfo {
  status: "trial" | "active" | "expired";
  billingCycle: "monthly" | "yearly" | null;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  isTrialExpired: boolean;
  canWrite: boolean;
}

interface SubscriptionBannerProps {
  subscription?: SubscriptionInfo | null;
  className?: string;
}

/**
 * Bannière affichant le statut de l'abonnement
 *
 * - En mode trial: affiche les jours restants
 * - En mode expired: affiche un message d'urgence avec CTA
 * - En mode active: n'affiche rien
 */
export function SubscriptionBanner({ subscription, className = "" }: SubscriptionBannerProps) {
  // Ne rien afficher si l'abonnement est actif ou si pas de données
  if (!subscription || subscription.status === "active") {
    return null;
  }

  // Mode EXPIRED - Bannière d'urgence
  if (subscription.status === "expired" || subscription.isTrialExpired) {
    return (
      <div
        className={`bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 ${className}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <span className="font-semibold">Votre essai est terminé</span>
              <span className="hidden sm:inline">
                {" "}
                – Abonnez-vous pour continuer à utiliser toutes les fonctionnalités
              </span>
            </div>
          </div>
          <Link
            href="/tableau-de-bord/abonnement"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Passer à l'abonnement
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // Mode TRIAL - Bannière informative
  if (subscription.status === "trial") {
    const daysText =
      subscription.trialDaysRemaining === 1
        ? "1 jour restant"
        : `${subscription.trialDaysRemaining} jours restants`;

    // Couleur selon l'urgence
    const isUrgent = subscription.trialDaysRemaining <= 2;
    const bgClass = isUrgent
      ? "bg-gradient-to-r from-amber-500 to-yellow-500"
      : "bg-gradient-to-r from-blue-500 to-indigo-500";

    return (
      <div className={`${bgClass} text-white px-4 py-2.5 ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <span className="font-medium">Période d'essai</span>
              <span className="hidden sm:inline"> – </span>
              <span className="font-semibold">{daysText}</span>
              <span className="hidden md:inline text-white/90">
                {" "}
                pour découvrir toutes les fonctionnalités
              </span>
            </span>
          </div>
          <Link
            href="/tableau-de-bord/abonnement"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
          >
            Voir les tarifs
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    );
  }

  return null;
}

/**
 * Composant qui bloque les actions en mode lecture seule
 */
interface ReadOnlyOverlayProps {
  subscription?: SubscriptionInfo | null;
  children: React.ReactNode;
  className?: string;
}

export function ReadOnlyOverlay({ subscription, children, className = "" }: ReadOnlyOverlayProps) {
  if (!subscription || subscription.canWrite) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center max-w-sm mx-4">
          <svg
            className="w-10 h-10 mx-auto mb-3 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Mode lecture seule
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Abonnez-vous pour modifier vos données
          </p>
          <Link
            href="/tableau-de-bord/abonnement"
            className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            S'abonner
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook pour récupérer les informations d'abonnement
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/me");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription || null);
        } else {
          setError("Erreur lors de la récupération de l'abonnement");
        }
      } catch (err) {
        console.error("Erreur fetch subscription:", err);
        setError("Erreur réseau");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return { subscription, loading, error };
}
