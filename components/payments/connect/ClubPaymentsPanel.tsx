"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ConnectAccountManagement,
  ConnectAccountOnboarding,
  ConnectNotificationBanner,
} from "@stripe/react-connect-js";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  DashboardBadge,
  GlassCard,
  dashboardTextSecondaryClass,
  cn,
} from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { CONNECT_COLLECTION_OPTIONS } from "@/lib/payments/connect/appearance";
import type { ClubConnectStatusDto } from "@/lib/payments/connect/types";
import type { ConnectUiMode } from "@/lib/payments/connect/ui-state";
import { AlertCircle, CheckCircle } from "@/lib/icons";
import ClubStripeConnectProvider from "./ClubStripeConnectProvider";

type ClubPaymentsPanelProps = {
  variant?: "hub" | "shop";
};

function statusOrEmpty(): ClubConnectStatusDto {
  return {
    account: null,
    ready: false,
    incomplete: false,
    label: "Non connecté",
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    requirements: {
      currentlyDue: [],
      pastDue: [],
      eventuallyDue: [],
      disabledReason: null,
    },
    actionRequired: false,
    uiMode: "intro",
  };
}

export default function ClubPaymentsPanel({
  variant = "hub",
}: ClubPaymentsPanelProps) {
  const { t } = useI18n();
  const { clubId, has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_shop") || has("access_settings");
  const [status, setStatus] = useState<ClubConnectStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [connectReady, setConnectReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/payments/connect/status", {
        cache: "no-store",
      });
      const data = (await res.json()) as ClubConnectStatusDto & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Impossible de charger Stripe.");
      setStatus(data);
      if (data.account?.providerAccountId) {
        setConnectReady(true);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("dashboard.paymentAccount.loadError");
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!permsLoading) loadStatus();
  }, [permsLoading, loadStatus]);

  const startOnboarding = async () => {
    if (!canManage) return;
    setStarting(true);
    try {
      const res = await fetch("/api/payments/connect/ensure", {
        method: "POST",
        cache: "no-store",
      });
      const data = (await res.json()) as ClubConnectStatusDto & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Connexion Stripe impossible");
      setStatus(data);
      setConnectReady(true);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t("dashboard.paymentAccount.loadError")
      );
    } finally {
      setStarting(false);
    }
  };

  if (permsLoading || loading) {
    return (
      <GlassCard>
        <div className="h-40 animate-pulse rounded-2xl bg-[#F1F5F9]" />
      </GlassCard>
    );
  }

  if (loadError) {
    return (
      <GlassCard>
        <p className="text-sm text-rose-700">{loadError}</p>
        <div className="mt-4">
          <DashboardPrimaryButton type="button" icon="none" onClick={loadStatus}>
            {t("dashboard.paymentAccount.retry")}
          </DashboardPrimaryButton>
        </div>
      </GlassCard>
    );
  }

  const current = status ?? statusOrEmpty();
  const mode: ConnectUiMode = current.uiMode;
  const showConnect =
    connectReady && Boolean(clubId) && Boolean(current.account?.providerAccountId);
  const showOnboarding = mode === "onboarding";
  const showManagement = mode === "ready" || mode === "action_required";

  return (
    <div className="space-y-5">
      {variant === "shop" ? (
        <p className={cn("text-sm leading-relaxed", dashboardTextSecondaryClass)}>
          {t("dashboard.paymentAccount.clubScope")}
        </p>
      ) : null}

      {mode === "intro" && !showConnect ? (
        <GlassCard>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            {t("dashboard.paymentAccount.receiveTitle")}
          </h2>
          <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed", dashboardTextSecondaryClass)}>
            {t("dashboard.paymentAccount.receiveBody")}
          </p>
          <div className="mt-6">
            <DashboardPrimaryButton
              type="button"
              icon="none"
              loading={starting}
              disabled={!canManage}
              onClick={startOnboarding}
            >
              {t("dashboard.paymentAccount.configureCta")}
            </DashboardPrimaryButton>
          </div>
          {!canManage ? (
            <p className={cn("mt-3 text-xs", dashboardTextSecondaryClass)}>
              {t("dashboard.paymentAccount.viewOnly")}
            </p>
          ) : null}
        </GlassCard>
      ) : (
        <StatusSummary status={current} />
      )}

      {showConnect && clubId && canManage ? (
        <ClubStripeConnectProvider clubId={clubId}>
          <ConnectSurfaces
            showOnboarding={showOnboarding}
            showManagement={showManagement}
            mode={mode}
            onRefresh={loadStatus}
          />
        </ClubStripeConnectProvider>
      ) : null}

      {showConnect && !canManage ? (
        <p className={cn("text-sm", dashboardTextSecondaryClass)}>
          {t("dashboard.paymentAccount.viewOnly")}
        </p>
      ) : null}
    </div>
  );
}

function StatusSummary({ status }: { status: ClubConnectStatusDto }) {
  const { t } = useI18n();
  const ready = status.uiMode === "ready";
  const actionRequired = status.uiMode === "action_required";

  return (
    <GlassCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            {t("dashboard.paymentAccount.paymentsLabel")}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#0F172A]">
            {ready ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            {ready
              ? `${t("dashboard.paymentAccount.connected")} ✓`
              : actionRequired
                ? t("dashboard.paymentAccount.actionRequired")
                : t("dashboard.paymentAccount.onboardingTitle")}
          </p>
        </div>
        <DashboardBadge variant={ready ? "success" : "warning"}>
          {status.label}
        </DashboardBadge>
      </div>

      {actionRequired ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.paymentAccount.actionRequiredBody")}
        </p>
      ) : null}

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatusCell
          label={t("dashboard.paymentAccount.paymentsLabel")}
          value={
            status.chargesEnabled
              ? t("dashboard.paymentAccount.paymentsActive")
              : t("dashboard.paymentAccount.paymentsInactive")
          }
          ok={status.chargesEnabled}
        />
        <StatusCell
          label={t("dashboard.paymentAccount.payoutsLabel")}
          value={
            status.payoutsEnabled
              ? t("dashboard.paymentAccount.payoutsActive")
              : t("dashboard.paymentAccount.payoutsInactive")
          }
          ok={status.payoutsEnabled}
        />
        <StatusCell
          label={t("dashboard.paymentAccount.configLabel")}
          value={
            status.detailsSubmitted && status.ready
              ? t("dashboard.paymentAccount.configDone")
              : t("dashboard.paymentAccount.configIncomplete")
          }
          ok={status.detailsSubmitted && status.ready}
        />
      </dl>
    </GlassCard>
  );
}

function StatusCell({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-[#94A3B8]">{label}</dt>
      <dd className={cn("mt-1 text-sm font-semibold", ok ? "text-emerald-700" : "text-amber-800")}>
        {value}
      </dd>
    </div>
  );
}

function ConnectSurfaces({
  showOnboarding,
  showManagement,
  mode,
  onRefresh,
}: {
  showOnboarding: boolean;
  showManagement: boolean;
  mode: ConnectUiMode;
  onRefresh: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
        <ConnectNotificationBanner collectionOptions={CONNECT_COLLECTION_OPTIONS} />

      {showOnboarding ? (
        <GlassCard>
          <h3 className="mb-4 text-base font-semibold text-[#0F172A]">
            {mode === "action_required"
              ? t("dashboard.paymentAccount.actionRequired")
              : t("dashboard.paymentAccount.onboardingTitle")}
          </h3>
          <ConnectAccountOnboarding
            collectionOptions={CONNECT_COLLECTION_OPTIONS}
            onExit={onRefresh}
            onLoadError={() => {
              toast.error(t("dashboard.paymentAccount.loadError"));
            }}
          />
        </GlassCard>
      ) : null}

      {showManagement ? (
        <GlassCard>
          <h3 className="text-base font-semibold text-[#0F172A]">
            {t("dashboard.paymentAccount.manageTitle")}
          </h3>
          <p className={cn("mt-1 mb-4 text-sm leading-relaxed", dashboardTextSecondaryClass)}>
            {t("dashboard.paymentAccount.manageBody")}
          </p>
          <ConnectAccountManagement
            collectionOptions={CONNECT_COLLECTION_OPTIONS}
            onLoadError={() => {
              toast.error(t("dashboard.paymentAccount.loadError"));
            }}
          />
        </GlassCard>
      ) : null}
    </div>
  );
}
