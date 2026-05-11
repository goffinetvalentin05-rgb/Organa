"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  SectionCard,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

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
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "cancelled") {
      // noop — message peut être affiché si nécessaire
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
        body: JSON.stringify({ billingInterval: billingCycle }),
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

  const monthlyPrice = pricing?.monthly.amount || 39;
  const yearlyPrice = pricing?.yearly.amount || 390;
  const yearlyMonthlyEquivalent = Math.round(yearlyPrice / 12);

  return (
    <PageLayout maxWidth="3xl">
      <PageHeader
        title="Abonnement"
        subtitle="Un seul plan, toutes les fonctionnalités. Simple et transparent."
      />

      {loading ? (
        <GlassCard padding="lg" className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </GlassCard>
      ) : (
        <>
          {subscription && (
            <GlassCard
              padding="lg"
              className={
                subscription.status === "active"
                  ? "border-emerald-300/70 bg-emerald-50/85"
                  : subscription.status === "trial"
                    ? "border-blue-300/70 bg-blue-50/85"
                    : "border-rose-300/70 bg-rose-50/85"
              }
            >
              <div className="flex items-center gap-3">
                {subscription.status === "active" ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/40">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-900">Abonnement actif</p>
                      <p className="text-sm text-emerald-800/90">
                        {subscription.billingCycle === "yearly" ? "Annuel" : "Mensuel"} – Accès complet à toutes les fonctionnalités
                      </p>
                    </div>
                  </>
                ) : subscription.status === "trial" ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/40">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">
                        Période d&apos;essai – {subscription.trialDaysRemaining} jour{subscription.trialDaysRemaining > 1 ? "s" : ""} restant{subscription.trialDaysRemaining > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-blue-800/90">
                        Profitez de toutes les fonctionnalités gratuitement
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-md shadow-rose-500/40">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-rose-900">Essai terminé</p>
                      <p className="text-sm text-rose-800/90">
                        Abonnez-vous pour continuer à utiliser l&apos;application
                      </p>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          )}

          {subscription?.status !== "active" && (
            <GlassCard padding="lg" className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <span
                  className={`font-medium ${
                    billingCycle === "monthly" ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  Mensuel
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
                  }
                  className={`relative h-7 w-14 cursor-pointer rounded-full transition-colors ${
                    billingCycle === "yearly"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                      : "bg-slate-300"
                  }`}
                  aria-label="Choisir la facturation mensuelle ou annuelle"
                >
                  <span
                    className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
                <div className="flex flex-col items-start leading-tight">
                  <span
                    className={`font-medium ${
                      billingCycle === "yearly" ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    Annuel
                  </span>
                  <span className="mt-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                    2 mois offerts
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-8 text-center shadow-sm">
                <div className="mb-6">
                  {billingCycle === "yearly" ? (
                    <>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-slate-900">{yearlyPrice}</span>
                        <span className="text-xl text-slate-600">CHF/an</span>
                      </div>
                      <p className="mt-2 text-slate-600">
                        soit <span className="font-semibold text-slate-900">{yearlyMonthlyEquivalent} CHF/mois</span>
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-slate-900">{monthlyPrice}</span>
                      <span className="text-xl text-slate-600">CHF/mois</span>
                    </div>
                  )}
                </div>

                <ul className="mx-auto mb-8 max-w-sm space-y-3 text-left">
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
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
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
                      <span className="text-slate-800">{feature}</span>
                    </li>
                  ))}
                </ul>

                <DashboardPrimaryButton
                  type="button"
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                  icon="none"
                  className="mx-auto w-full max-w-sm justify-center"
                >
                  {checkoutLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
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
                    `S'abonner – ${
                      billingCycle === "yearly"
                        ? yearlyPrice + " CHF/an"
                        : monthlyPrice + " CHF/mois"
                    }`
                  )}
                </DashboardPrimaryButton>

                <p className="mt-4 text-sm text-slate-500">
                  Paiement sécurisé par Stripe. Annulation possible à tout moment.
                </p>
              </div>
            </GlassCard>
          )}

          <SectionCard
            title="Questions fréquentes"
            description="Tout ce que vous devez savoir avant de vous abonner."
          >
            <div className="space-y-3">
              {[
                {
                  q: "Que se passe-t-il après les 7 jours d'essai ?",
                  a: "Après 7 jours, votre compte passe en mode lecture seule. Vous pouvez toujours consulter vos données, mais vous ne pouvez plus créer ou modifier d'éléments. Abonnez-vous pour retrouver l'accès complet.",
                },
                {
                  q: "Puis-je annuler mon abonnement ?",
                  a: "Oui, vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période payée. Aucun remboursement partiel n'est effectué.",
                },
                {
                  q: "Pourquoi choisir l'annuel ?",
                  a: "L'abonnement annuel inclut 2 mois offerts. C'est idéal pour les clubs qui savent qu'ils utiliseront l'application sur le long terme.",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-slate-200/70 bg-white/90 p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                    {item.q}
                    <svg
                      className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </PageLayout>
  );
}
