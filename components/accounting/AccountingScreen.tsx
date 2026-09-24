"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, PageLayout, GlassCard } from "@/components/ui";
import AccountingLanding from "@/components/accounting/AccountingLanding";
import AccountingOnboarding from "@/components/accounting/AccountingOnboarding";
import ChartPanel from "@/components/accounting/ChartPanel";
import JournalGrid from "@/components/accounting/JournalGrid";
import PeriodsPanel from "@/components/accounting/PeriodsPanel";
import ReportsPanel from "@/components/accounting/ReportsPanel";
import SettingsPanel from "@/components/accounting/SettingsPanel";
import { accountBalances, type Account, type Attachment, type Entry, type InboxItem, type JournalLine, type Period } from "@/components/accounting/model";
import { accountingPriceDetail, accountingPriceLabel } from "@/lib/billing/pricing";
import { ACCOUNTING_TAGLINE } from "@/lib/accounting/copy";
import { formatSwissDate, zurichToday } from "@/lib/accounting/format";

type Section = "overview" | "journal" | "review" | "chart" | "reports" | "periods" | "settings";

const NAV = [
  { href: "/tableau-de-bord/comptabilite/journal", section: "journal" as const, label: "Journal" },
  { href: "/tableau-de-bord/comptabilite/plan", section: "chart" as const, label: "Plan comptable" },
  { href: "/tableau-de-bord/comptabilite/rapports", section: "reports" as const, label: "Rapports" },
  { href: "/tableau-de-bord/comptabilite/exercices", section: "periods" as const, label: "Exercices" },
  { href: "/tableau-de-bord/comptabilite/parametres", section: "settings" as const, label: "Paramètres" },
];

export default function AccountingScreen({ section }: { section: Section }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const response = await fetch("/api/accounting", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Impossible de charger la comptabilité");
      setLoading(false);
      return;
    }
    setData(body);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/accounting", { cache: "no-store" })
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) setError(body.error || "Impossible de charger la comptabilité");
        else setData(body);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Impossible de charger la comptabilité");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(payload: Record<string, unknown>) {
    setError(null);
    const response = await fetch("/api/accounting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Action impossible");
      return null;
    }
    await reload();
    return body;
  }

  const accounts = (data?.accounts || []) as Account[];
  const entries = (data?.entries || []) as Entry[];
  const linesByEntry = (data?.linesByEntry || {}) as Record<string, JournalLine[]>;
  const balances = useMemo(() => accountBalances(entries, linesByEntry, accounts), [accounts, entries, linesByEntry]);

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title="Comptabilité" subtitle={ACCOUNTING_TAGLINE} />
      </PageLayout>
    );
  }

  const access = (data?.access || {}) as {
    entitled?: boolean;
    onboarded?: boolean;
    canWrite?: boolean;
    canManage?: boolean;
    autoValidate?: boolean;
    startDate?: string | null;
  };
  const priceLabel = String(data?.priceLabel || accountingPriceLabel());
  const priceDetail = String(data?.priceDetail || accountingPriceDetail());

  if (!access.onboarded) {
    if (!access.entitled) {
      return (
        <PageLayout>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <AccountingLanding priceLabel={priceLabel} priceDetail={priceDetail} />
        </PageLayout>
      );
    }
    return (
      <PageLayout>
        <PageHeader title="Comptabilité" subtitle={<p>{ACCOUNTING_TAGLINE}</p>} />
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <AccountingOnboarding usesStripe={Boolean(data?.usesStripe)} onDone={act} />
      </PageLayout>
    );
  }

  const summary = (data?.summary || {}) as Record<string, number>;
  const review = (data?.review || { count: 0, amount: 0, inbox: [], entries: [] }) as {
    count: number;
    amount: number;
    inbox: InboxItem[];
    entries: Entry[];
  };
  const periods = (data?.periods || []) as Period[];
  const attachments = (data?.attachments || []) as Attachment[];
  const coverage = (data?.coverage || {}) as { note?: string | null; type?: string | null };
  const startsLater = Boolean(access.startDate && access.startDate > zurichToday());
  const openItems = data?.openItems as { receivableTotal: number; payableTotal: number } | null;
  const reviewCount = review.count;

  return (
    <PageLayout>
      <PageHeader title="Comptabilité" subtitle={<p>{ACCOUNTING_TAGLINE}</p>} />
      <nav className="flex flex-wrap gap-2">
        {NAV.map((item) => {
          const active = item.section === section || (item.section === "journal" && section === "review");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm ${active ? "bg-[#1A23FF] font-semibold text-white" : "bg-white text-[#475569] ring-1 ring-inset ring-[rgba(15,23,42,0.08)]"}`}
            >
              {item.label}
              {item.section === "journal" && reviewCount > 0 ? ` · ${reviewCount}` : ""}
            </Link>
          );
        })}
      </nav>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {startsLater ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Votre comptabilité Obillz commencera le {formatSwissDate(access.startDate)}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475569]">Les encaissements et les dépenses antérieurs à cette date ne sont pas comptabilisés.</p>
        </GlassCard>
      ) : null}
      {section === "journal" || section === "review" ? (
        <JournalGrid
          entries={entries}
          accounts={accounts}
          linesByEntry={linesByEntry}
          periods={periods}
          attachments={attachments}
          inbox={review.inbox}
          reviewOnly={section === "review"}
          canWrite={Boolean(access.canWrite)}
          onAct={act}
          onReload={reload}
        />
      ) : null}
      {section === "chart" ? (
        <ChartPanel
          accounts={accounts}
          balances={balances}
          entries={entries}
          linesByEntry={linesByEntry}
          canWrite={Boolean(access.canWrite)}
          onAct={act}
        />
      ) : null}
      {section === "reports" ? (
        <ReportsPanel summary={summary} entries={entries} accounts={accounts} linesByEntry={linesByEntry} coverageNote={coverage.note} />
      ) : null}
      {section === "periods" ? (
        <PeriodsPanel
          periods={periods}
          openItems={openItems}
          canWrite={Boolean(access.canWrite)}
          startDate={access.startDate}
          coverageNote={coverage.note}
          coverageType={coverage.type}
          onAct={act}
        />
      ) : null}
      {section === "settings" ? (
        <SettingsPanel
          autoValidate={Boolean(access.autoValidate)}
          startDate={access.startDate}
          coverageNote={coverage.note}
          canWrite={Boolean(access.canWrite)}
          onAct={act}
        />
      ) : null}
    </PageLayout>
  );
}
