"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, CreditCard, QrCode } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { notifyError } from "@/lib/notify";
import {
  cn,
  dashboardIconBadgeSubtleClass,
  dashboardPopoverPanelClass,
  dashboardSecondaryButtonClass,
} from "@/components/ui";
import { useDismissibleMenu } from "@/lib/ui/useDismissibleMenu";
import type { MembershipPaymentMethod } from "@/lib/quotes/payment-method";

type PaymentMethodResponse = {
  method?: MembershipPaymentMethod;
  stripeReady?: boolean;
  error?: string;
};

const STRIPE_SETUP_HREF = "/tableau-de-bord/compte-de-paiement";

export default function MembershipPaymentMethodControl() {
  const { t } = useI18n();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_invoices") || has("manage_documents");
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<MembershipPaymentMethod>("qr_invoice");
  const [stripeReady, setStripeReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | HTMLAnchorElement | null>>([]);
  const persistGen = useRef(0);
  const listboxId = useId();

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

  const dismiss = useCallback(() => setOpen(false), []);
  const rootRef = useDismissibleMenu(open, dismiss);
  const closeMenu = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = method === "stripe" && stripeReady ? 1 : 0;
    optionRefs.current[selectedIndex]?.focus();
  }, [open, method, stripeReady]);

  const persist = async (
    next: MembershipPaymentMethod,
    previous: MembershipPaymentMethod
  ) => {
    const gen = ++persistGen.current;
    try {
      const res = await fetch("/api/quotes/payment-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: next }),
      });
      const data = (await res.json()) as PaymentMethodResponse;
      if (gen !== persistGen.current) return;
      if (!res.ok) throw new Error(data.error || t("dashboard.quotes.paymentMethod.saveError"));
      setMethod(data.method === "stripe" ? "stripe" : "qr_invoice");
      setStripeReady(Boolean(data.stripeReady));
    } catch (error: unknown) {
      if (gen !== persistGen.current) return;
      setMethod((current) => (current === next ? previous : current));
      notifyError(
        error instanceof Error ? error.message : t("dashboard.quotes.paymentMethod.saveError")
      );
    }
  };

  const selectMethod = (next: MembershipPaymentMethod) => {
    if (next === "stripe" && !stripeReady) return;
    closeMenu();
    if (next === method) return;
    const previous = method;
    setMethod(next);
    void persist(next, previous);
  };

  const focusOption = (index: number) => {
    const options = optionRefs.current.filter(Boolean);
    const target = options[index];
    target?.focus();
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const options = optionRefs.current.filter(Boolean);
    const currentIndex = options.findIndex((el) => el === document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(Math.min(options.length - 1, currentIndex + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(Math.max(0, currentIndex - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(options.length - 1);
    }
  };

  const currentLabel =
    method === "stripe"
      ? t("dashboard.quotes.paymentMethod.stripe")
      : t("dashboard.quotes.paymentMethod.qr");
  const CurrentIcon = method === "stripe" ? CreditCard : QrCode;

  if (loading || permsLoading) {
    return (
      <div className="h-10 w-[13.5rem] animate-pulse rounded-xl bg-[#F1F5F9]" aria-hidden />
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={!canManage}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className={cn(
          dashboardSecondaryButtonClass,
          "h-auto min-h-10 max-w-full justify-between gap-2.5 px-2.5 py-1.5 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,35,255,0.22)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        <span className={cn(dashboardIconBadgeSubtleClass, "h-8 w-8 rounded-lg")}>
          <CurrentIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
            {t("dashboard.quotes.paymentMethod.label")}
          </span>
          <span className="block truncate text-sm font-semibold text-[#0F172A]">{currentLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#94A3B8] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t("dashboard.quotes.paymentMethod.label")}
          onKeyDown={onListKeyDown}
          className={cn(
            dashboardPopoverPanelClass,
            "absolute left-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] space-y-2 p-2 md:left-auto md:right-0"
          )}
        >
          <OptionCard
            refCallback={(el) => {
              optionRefs.current[0] = el;
            }}
            selected={method === "qr_invoice"}
            icon={<QrCode className="h-4 w-4" />}
            title={t("dashboard.quotes.paymentMethod.qr")}
            description={t("dashboard.quotes.paymentMethod.qrDescription")}
            onSelect={() => selectMethod("qr_invoice")}
          />
          {stripeReady ? (
            <OptionCard
              refCallback={(el) => {
                optionRefs.current[1] = el;
              }}
              selected={method === "stripe"}
              icon={<CreditCard className="h-4 w-4" />}
              title={t("dashboard.quotes.paymentMethod.stripe")}
              description={t("dashboard.quotes.paymentMethod.stripeDescription")}
              onSelect={() => selectMethod("stripe")}
            />
          ) : (
            <Link
              ref={(el) => {
                optionRefs.current[1] = el;
              }}
              href={STRIPE_SETUP_HREF}
              role="option"
              aria-selected={false}
              aria-disabled="true"
              onClick={() => setOpen(false)}
              className={cn(
                optionShellClass,
                "cursor-pointer opacity-70 hover:bg-white"
              )}
            >
              <OptionContent
                selected={false}
                icon={<CreditCard className="h-4 w-4" />}
                title={t("dashboard.quotes.paymentMethod.stripe")}
                description={t("dashboard.quotes.paymentMethod.notConfigured")}
                footer={
                  <span className="mt-1 inline-block text-sm font-semibold text-[#1A23FF]">
                    {t("dashboard.quotes.paymentMethod.configure")}
                  </span>
                }
              />
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}

const optionShellClass =
  "flex min-h-[4.25rem] w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,35,255,0.22)]";

function OptionCard({
  selected,
  icon,
  title,
  description,
  onSelect,
  refCallback,
}: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onSelect: () => void;
  refCallback: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={refCallback}
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        optionShellClass,
        selected
          ? "border-[rgba(26,35,255,0.28)] bg-[rgba(26,35,255,0.06)] shadow-[0_0_0_1px_rgba(26,35,255,0.08)]"
          : "border-[rgba(15,23,42,0.08)] bg-white hover:border-[rgba(26,35,255,0.18)] hover:bg-[#F8FAFC]"
      )}
    >
      <OptionContent selected={selected} icon={icon} title={title} description={description} />
    </button>
  );
}

function OptionContent({
  selected,
  icon,
  title,
  description,
  footer,
}: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  footer?: ReactNode;
}) {
  return (
    <>
      <span
        className={cn(
          dashboardIconBadgeSubtleClass,
          "mt-0.5 h-9 w-9",
          selected ? "bg-[rgba(26,35,255,0.12)] text-[#1A23FF]" : "text-[#64748B]"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#0F172A]">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[#64748B]">{description}</span>
        {footer}
      </span>
      {selected ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1A23FF]" aria-hidden />
      ) : (
        <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      )}
    </>
  );
}
