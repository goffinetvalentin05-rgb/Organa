"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Types
interface SubscriptionInfo {
  status: "trial" | "active" | "expired";
  billingCycle: "monthly" | "yearly" | null;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  isTrialExpired: boolean;
  canWrite: boolean;
}

interface Pricing {
  monthly: { amount: number; currency: string; label: string; period: string };
  yearly: { amount: number; currency: string; label: string; period: string; savings: string };
}

export default function AbonnementClient() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    fetchSubscriptionInfo();

    // Vérifier si on revient d'un checkout réussi ou annulé
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "cancelled") {
      // Afficher un message d'annulation si nécessaire
    }
  }, [searchParams]);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription || null);
        setPricing(data.pricing || null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des infos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setCheckoutLoading(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Erreur checkout:", data.error);
        alert(data.message || "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors du checkout:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Calculer le prix
  const monthlyPrice = pricing?.monthly.amount || 25;
  const yearlyPrice = pricing?.yearly.amount || 270;
  const yearlyMonthlyEquivalent = Math.round(yearlyPrice / 12);
  const savings = monthlyPrice * 12 - yearlyPrice;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Abonnement</h1>
        <p className="mt-2 text-secondary">
          Un seul plan, toutes les fonctionnalités. Simple et transparent.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 accent-border-strong"></div>
        </div>
      ) : (
        <>
          {/* Statut actuel */}
          {subscription && (
            <div
              className={`p-4 rounded-xl border-2 ${
                subscription.status === "active"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : subscription.status === "trial"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-red-500 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {subscription.status === "active" ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">
                        Abonnement actif
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {subscription.billingCycle === "yearly" ? "Annuel" : "Mensuel"} – Accès complet à toutes les fonctionnalités
                      </p>
                    </div>
                  </>
                ) : subscription.status === "trial" ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">
                        Période d'essai – {subscription.trialDaysRemaining} jour{subscription.trialDaysRemaining > 1 ? "s" : ""} restant{subscription.trialDaysRemaining > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Profitez de toutes les fonctionnalités gratuitement
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200">
                        Essai terminé
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Abonnez-vous pour continuer à utiliser l'application
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Carte de tarification (visible seulement si pas d'abonnement actif) */}
          {subscription?.status !== "active" && (
            <div className="bg-surface rounded-2xl border-2 border-subtle overflow-hidden">
              {/* Toggle Mensuel/Annuel */}
              <div className="p-6 border-b border-subtle bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-center gap-4">
                  <span
                    className={`font-medium ${billingCycle === "monthly" ? "text-primary" : "text-secondary"}`}
                  >
                    Mensuel
                  </span>
                  <button
                    onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      billingCycle === "yearly" ? "accent-bg" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        billingCycle === "yearly" ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={`font-medium ${billingCycle === "yearly" ? "text-primary" : "text-secondary"}`}
                  >
                    Annuel
                  </span>
                  {billingCycle === "yearly" && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                      -{savings} CHF/an
                    </span>
                  )}
                </div>
              </div>

              {/* Prix et détails */}
              <div className="p-8 text-center">
                <div className="mb-6">
                  {billingCycle === "yearly" ? (
                    <>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-primary">{yearlyPrice}</span>
                        <span className="text-xl text-secondary">CHF/an</span>
                      </div>
                      <p className="mt-2 text-secondary">
                        soit <span className="font-semibold">{yearlyMonthlyEquivalent} CHF/mois</span>
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-primary">{monthlyPrice}</span>
                      <span className="text-xl text-secondary">CHF/mois</span>
                    </div>
                  )}
                </div>

                {/* Fonctionnalités */}
                <ul className="space-y-3 mb-8 text-left max-w-sm mx-auto">
                  {[
                    "Membres illimités",
                    "Événements illimités",
                    "Plannings & affectations",
                    "Factures & devis",
                    "Gestion des dépenses",
                    "QR Codes personnalisés",
                    "Export des données",
                    "Support prioritaire",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
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
                      <span className="text-primary">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bouton d'abonnement */}
                <button
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                  className="w-full max-w-sm px-6 py-3 accent-bg text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Chargement...
                    </span>
                  ) : (
                    `S'abonner – ${billingCycle === "yearly" ? yearlyPrice + " CHF/an" : monthlyPrice + " CHF/mois"}`
                  )}
                </button>

                <p className="mt-4 text-sm text-secondary">
                  Paiement sécurisé par Stripe. Annulation possible à tout moment.
                </p>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Questions fréquentes</h2>
            <div className="space-y-3">
              <details className="group bg-surface rounded-lg border border-subtle p-4">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  Que se passe-t-il après les 7 jours d'essai ?
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-secondary">
                  Après 7 jours, votre compte passe en mode lecture seule. Vous pouvez toujours consulter vos données, mais vous ne pouvez plus créer ou modifier d'éléments. Abonnez-vous pour retrouver l'accès complet.
                </p>
              </details>
              <details className="group bg-surface rounded-lg border border-subtle p-4">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  Puis-je annuler mon abonnement ?
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-secondary">
                  Oui, vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période payée. Aucun remboursement partiel n'est effectué.
                </p>
              </details>
              <details className="group bg-surface rounded-lg border border-subtle p-4">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  Pourquoi choisir l'annuel ?
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-secondary">
                  L'abonnement annuel vous fait économiser {savings} CHF par an par rapport au mensuel. C'est idéal pour les clubs qui savent qu'ils utiliseront l'application sur le long terme.
                </p>
              </details>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
