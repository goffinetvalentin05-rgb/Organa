"use client";

import { accountingPriceDetail, accountingPriceLabel } from "@/lib/billing/pricing";
import {
  ACCOUNTING_BENEFITS,
  ACCOUNTING_MODULES,
  ACCOUNTING_PITCH,
  ACCOUNTING_PRICE_NOTE,
  ACCOUNTING_SCOPE_NOTE,
  ACCOUNTING_STEPS,
  ACCOUNTING_TAGLINE,
} from "@/lib/accounting/copy";
import { ActionButton, GlassCard } from "@/components/ui";

export default function AccountingLanding({
  priceLabel,
  priceDetail,
}: {
  priceLabel?: string;
  priceDetail?: string;
}) {
  const label = priceLabel || accountingPriceLabel();
  const detail = priceDetail || accountingPriceDetail();

  async function activate() {
    const response = await fetch("/api/stripe/accounting/checkout", { method: "POST" });
    const body = await response.json();
    if (body.url) {
      window.location.href = body.url;
      return;
    }
    if (body.alreadyEntitled) {
      window.location.href = "/tableau-de-bord/comptabilite";
      return;
    }
    window.alert(body.message || body.error || "Activation indisponible");
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <GlassCard padding="lg" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#1A23FF]/10 blur-3xl"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A23FF]">Module</p>
        <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.03em] text-[#0F172A] md:text-[2.4rem]">
          Comptabilité
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#334155]">{ACCOUNTING_TAGLINE}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#64748B] md:text-[0.95rem]">
          {ACCOUNTING_PITCH}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ActionButton type="button" variant="premiumInline" onClick={() => void activate()}>
            Activer la comptabilité — {label}
          </ActionButton>
          <a
            href="#comment-ca-marche"
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#1A23FF] hover:bg-[#F8FAFF]"
          >
            Voir comment ça fonctionne
          </a>
        </div>
      </GlassCard>

      <section aria-labelledby="benefices" className="space-y-4">
        <h2 id="benefices" className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
          Ce que le module change
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACCOUNTING_BENEFITS.map((item) => (
            <GlassCard key={item.title} padding="sm">
              <h3 className="text-sm font-semibold text-[#0F172A]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{item.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section id="comment-ca-marche" aria-labelledby="fonctionnement" className="scroll-mt-24 space-y-4">
        <h2 id="fonctionnement" className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
          Comment ça marche
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {ACCOUNTING_STEPS.map((step, index) => (
            <li key={step.title}>
              <GlassCard padding="sm" className="h-full">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-semibold text-[#1A23FF]">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{step.text}</p>
              </GlassCard>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="contenu" className="space-y-4">
        <h2 id="contenu" className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
          Ce que le module contient
        </h2>
        <GlassCard padding="md">
          <ul className="flex flex-wrap gap-2">
            {ACCOUNTING_MODULES.map((item) => (
              <li
                key={item}
                className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-sm font-medium text-[#0F172A] ring-1 ring-inset ring-[rgba(15,23,42,0.06)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>

      <section aria-labelledby="tarif">
        <GlassCard padding="lg" className="border border-[rgba(26,35,255,0.12)]">
          <h2 id="tarif" className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
            Comptabilité
          </h2>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">{detail}</p>
          <p className="mt-3 max-w-xl text-sm text-[#64748B]">{ACCOUNTING_PRICE_NOTE}</p>
          <div className="mt-6">
            <ActionButton type="button" variant="premiumInline" onClick={() => void activate()}>
              Activer maintenant
            </ActionButton>
          </div>
        </GlassCard>
      </section>

      <p className="max-w-3xl text-xs leading-relaxed text-[#64748B]">{ACCOUNTING_SCOPE_NOTE}</p>
    </div>
  );
}
