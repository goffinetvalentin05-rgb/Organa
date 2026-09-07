"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CreditCard, QrCode } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { cn } from "@/components/ui";
import type { MembershipPaymentMethod } from "@/lib/quotes/payment-method";

type QuotePaymentMethodFieldProps = {
  method: MembershipPaymentMethod;
  stripeReady: boolean;
  disabled?: boolean;
  onChange: (method: MembershipPaymentMethod) => void;
};

export default function QuotePaymentMethodField({
  method,
  stripeReady,
  disabled,
  onChange,
}: QuotePaymentMethodFieldProps) {
  const { t } = useI18n();
  const detail =
    method === "stripe"
      ? t("dashboard.quotes.paymentMethod.stripeDetail")
      : t("dashboard.quotes.paymentMethod.qrDetail");

  return (
    <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
        {t("dashboard.quotes.paymentMethod.label")}
      </p>
      <p className="mt-1 text-sm font-medium text-[#0F172A]">{detail}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
        {t("dashboard.quotes.paymentMethod.overrideHint")}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <MethodChoice
          selected={method === "qr_invoice"}
          disabled={disabled}
          icon={<QrCode className="h-4 w-4" />}
          label={t("dashboard.quotes.paymentMethod.qr")}
          onClick={() => onChange("qr_invoice")}
        />
        <MethodChoice
          selected={method === "stripe"}
          disabled={disabled || !stripeReady}
          icon={<CreditCard className="h-4 w-4" />}
          label={t("dashboard.quotes.paymentMethod.stripe")}
          onClick={() => onChange("stripe")}
        />
      </div>
      {!stripeReady ? (
        <p className="mt-2 text-xs text-[#64748B]">
          {t("dashboard.quotes.paymentMethod.notConfigured")}{" "}
          <Link
            href="/tableau-de-bord/compte-de-paiement"
            className="font-medium text-[#1A23FF] hover:underline"
          >
            {t("dashboard.quotes.paymentMethod.configureStripe")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function MethodChoice({
  selected,
  disabled,
  icon,
  label,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#0F172A]"
          : "border-subtle-hover bg-white text-[#475569] hover:border-[#7C5CFF]/40"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
