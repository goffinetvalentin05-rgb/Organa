"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, CreditCard, QrCode } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  cn,
  dashboardPopoverPanelClass,
  dashboardSecondaryButtonClass,
} from "@/components/ui";
import type { MembershipPaymentMethod } from "@/lib/quotes/payment-method";

type PaymentMethodResponse = {
  method?: MembershipPaymentMethod;
  stripeReady?: boolean;
  error?: string;
};

export default function MembershipPaymentMethodControl() {
  const { t } = useI18n();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_invoices") || has("manage_documents");
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<MembershipPaymentMethod>("qr_invoice");
  const [stripeReady, setStripeReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes/payment-method", { cache: "no-store" });
      const data = (await res.json()) as PaymentMethodResponse;
      if (!res.ok) throw new Error(data.error || t("dashboard.quotes.loadError"));
      setMethod(data.method === "stripe" ? "stripe" : "qr_invoice");
      setStripeReady(Boolean(data.stripeReady));
    } catch (error: unknown) {
      notifyError(error instanceof Error ? error.message : t("dashboard.common.unexpectedError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const selectMethod = async (next: MembershipPaymentMethod) => {
    if (next === method || saving) return;
    if (next === "stripe" && !stripeReady) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quotes/payment-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: next }),
      });
      const data = (await res.json()) as PaymentMethodResponse;
      if (!res.ok) throw new Error(data.error || t("dashboard.quotes.paymentMethod.saveError"));
      setMethod(data.method === "stripe" ? "stripe" : "qr_invoice");
      setStripeReady(Boolean(data.stripeReady));
      setOpen(false);
      notifySuccess(t("dashboard.quotes.paymentMethod.saved"));
    } catch (error: unknown) {
      notifyError(error instanceof Error ? error.message : t("dashboard.quotes.paymentMethod.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const currentLabel =
    method === "stripe"
      ? t("dashboard.quotes.paymentMethod.stripe")
      : t("dashboard.quotes.paymentMethod.qr");

  if (loading || permsLoading) {
    return (
      <div className="h-10 w-[13.5rem] animate-pulse rounded-xl bg-[#F1F5F9]" aria-hidden />
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={!canManage || saving}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          dashboardSecondaryButtonClass,
          "h-10 max-w-full justify-between px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
            {t("dashboard.quotes.paymentMethod.label")}
          </span>
          <span className="block truncate text-sm font-medium text-[#0F172A]">{currentLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
      </button>

      {open ? (
        <div
          className={cn(
            dashboardPopoverPanelClass,
            "absolute left-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] p-2 md:left-auto md:right-0"
          )}
          role="listbox"
        >
          <OptionRow
            selected={method === "qr_invoice"}
            icon={<QrCode className="h-4 w-4" />}
            title={t("dashboard.quotes.paymentMethod.qr")}
            description={t("dashboard.quotes.paymentMethod.qrDescription")}
            onClick={() => void selectMethod("qr_invoice")}
          />
          <OptionRow
            selected={method === "stripe"}
            disabled={!stripeReady}
            icon={<CreditCard className="h-4 w-4" />}
            title={t("dashboard.quotes.paymentMethod.stripe")}
            description={
              stripeReady
                ? t("dashboard.quotes.paymentMethod.stripeDescription")
                : t("dashboard.quotes.paymentMethod.notConfigured")
            }
            onClick={() => void selectMethod("stripe")}
          />
          {!stripeReady ? (
            <Link
              href="/tableau-de-bord/compte-de-paiement"
              className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-[#1A23FF] hover:bg-[#F8FAFC]"
              onClick={() => setOpen(false)}
            >
              {t("dashboard.quotes.paymentMethod.configureStripe")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function OptionRow({
  selected,
  disabled,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition",
        selected ? "bg-[#F8FAFC]" : "hover:bg-[#F8FAFC]",
        disabled && "cursor-not-allowed opacity-55"
      )}
    >
      <span className="mt-0.5 text-[#64748B]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#0F172A]">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[#64748B]">{description}</span>
      </span>
    </button>
  );
}
