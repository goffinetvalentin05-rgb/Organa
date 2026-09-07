"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import { ConnectComponentsProvider } from "@stripe/react-connect-js";
import {
  CONNECT_FONTS,
  getConnectAppearance,
  mapConnectLocale,
} from "@/lib/payments/connect/appearance";
import { useI18n } from "@/components/I18nProvider";
import { GlassCard } from "@/components/ui";

const instancesByClub = new Map<string, StripeConnectInstance>();

async function fetchClubClientSecret(): Promise<string> {
  const res = await fetch("/api/payments/connect/account-session", {
    method: "POST",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    clientSecret?: string;
    error?: string;
  };
  if (!res.ok || !data.clientSecret) {
    throw new Error(data.error || "Impossible de créer la session Stripe.");
  }
  return data.clientSecret;
}

function getOrCreateConnectInstance(
  clubId: string,
  locale: string
): StripeConnectInstance {
  const existing = instancesByClub.get(clubId);
  if (existing) {
    existing.update({
      locale,
      appearance: getConnectAppearance(),
    });
    return existing;
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey || !publishableKey.startsWith("pk_")) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquante");
  }

  const instance = loadConnectAndInitialize({
    publishableKey,
    fetchClientSecret: fetchClubClientSecret,
    appearance: getConnectAppearance(),
    locale,
    fonts: CONNECT_FONTS,
  });
  instancesByClub.set(clubId, instance);
  return instance;
}

const emptySubscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function ClubStripeConnectProvider({
  clubId,
  children,
}: {
  clubId: string;
  children: ReactNode;
}) {
  const { locale, t } = useI18n();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    clientSnapshot,
    serverSnapshot
  );

  const result = useMemo(() => {
    if (!isClient) return { instance: null as StripeConnectInstance | null, error: null as string | null };
    try {
      return {
        instance: getOrCreateConnectInstance(clubId, mapConnectLocale(locale)),
        error: null as string | null,
      };
    } catch (err) {
      return {
        instance: null,
        error:
          err instanceof Error
            ? err.message
            : t("dashboard.paymentAccount.loadError"),
      };
    }
  }, [clubId, isClient, locale, t]);

  if (result.error) {
    return (
      <GlassCard>
        <p className="text-sm text-rose-700">{result.error}</p>
      </GlassCard>
    );
  }

  if (!result.instance) {
    return (
      <GlassCard>
        <p className="text-sm text-[#64748B]">
          {t("dashboard.paymentAccount.loading")}
        </p>
      </GlassCard>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={result.instance}>
      {children}
    </ConnectComponentsProvider>
  );
}
