"use client";

import { useState, type ReactNode } from "react";
import { X, CheckCircle, Users, Shield, UserPlus, Clock } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

interface TeamUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const BENEFIT_ICONS = [UserPlus, Shield, Users, Shield, Clock] as const;

const BENEFIT_KEYS = [
  "dashboard.settings.teamUpgrade.benefit1",
  "dashboard.settings.teamUpgrade.benefit2",
  "dashboard.settings.teamUpgrade.benefit3",
  "dashboard.settings.teamUpgrade.benefit4",
  "dashboard.settings.teamUpgrade.benefit5",
] as const;

export default function TeamUpgradeModal({ open, onClose }: TeamUpgradeModalProps) {
  const { t } = useI18n();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  if (!open) return null;

  const benefits = BENEFIT_KEYS.map((key) => t(key));

  const handleUpgrade = async () => {
    try {
      setCheckoutLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingInterval: billingCycle, plan: "team" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(
        data.message || t("dashboard.settings.teamUpgrade.checkoutUnavailable")
      );
    } catch {
      alert(t("dashboard.settings.teamUpgrade.checkoutError"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Obillz Équipe
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            {t("dashboard.settings.teamUpgrade.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            {t("dashboard.settings.teamUpgrade.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label={t("dashboard.common.cancel")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <ul className="mb-6 space-y-3">
        {benefits.map((text, index) => {
          const Icon = BENEFIT_ICONS[index] ?? CheckCircle;
          return (
            <li key={text} className="flex items-start gap-3 text-sm text-white/85">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-200">
                <Icon className="h-4 w-4" />
              </span>
              <span className="leading-relaxed">{text}</span>
            </li>
          );
        })}
      </ul>

      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <BillingToggle
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          t={t}
        />
        <p className="text-center text-lg font-bold text-white">
          {t("dashboard.settings.teamUpgrade.price")}
        </p>
        <p className="mt-1 text-center text-xs text-white/60">
          {t("dashboard.settings.teamUpgrade.priceHint")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <DashboardPrimaryButton
          type="button"
          onClick={handleUpgrade}
          disabled={checkoutLoading}
          className="flex-1 justify-center"
        >
          {checkoutLoading
            ? t("dashboard.settings.teamUpgrade.checkoutLoading")
            : t("dashboard.settings.teamUpgrade.ctaPrimary")}
        </DashboardPrimaryButton>
        <a
          href="mailto:contact@obillz.com"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {t("dashboard.settings.teamUpgrade.ctaSecondary")}
        </a>
      </div>
    </ModalOverlay>
  );
}

function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-slate-900/95 p-6 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

function BillingToggle({
  billingCycle,
  setBillingCycle,
  t,
}: {
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (v: "monthly" | "yearly") => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-3 flex gap-2">
      <button
        type="button"
        onClick={() => setBillingCycle("yearly")}
        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
          billingCycle === "yearly"
            ? "bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] text-white shadow-md"
            : "text-white/70 hover:bg-white/10"
        }`}
      >
        {t("dashboard.settings.teamUpgrade.billingYearly")}
      </button>
      <button
        type="button"
        onClick={() => setBillingCycle("monthly")}
        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
          billingCycle === "monthly"
            ? "bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] text-white shadow-md"
            : "text-white/70 hover:bg-white/10"
        }`}
      >
        {t("dashboard.settings.teamUpgrade.billingMonthly")}
      </button>
    </div>
  );
}
