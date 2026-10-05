"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, PageLayout, GlassCard } from "@/components/ui";
import AccountingLanding from "@/components/accounting/AccountingLanding";
import AccountingOnboarding from "@/components/accounting/AccountingOnboarding";
import BudgetPanel from "@/components/accounting/BudgetPanel";
import ChartPanel from "@/components/accounting/ChartPanel";
import JournalGrid from "@/components/accounting/JournalGrid";
import PeriodsPanel from "@/components/accounting/PeriodsPanel";
import ReportsPanel from "@/components/accounting/ReportsPanel";
import SettingsPanel from "@/components/accounting/SettingsPanel";
import { isBankSystemCode } from "@/lib/accounting/financialAccounts";
import { accountBalances, type Account, type AccountGroup, type Attachment, type BudgetRecord, type Entry, type InboxItem, type JournalLine, type Period } from "@/components/accounting/model";
import { accountingPriceDetail, accountingPriceLabel } from "@/lib/billing/pricing";
import { ACCOUNTING_TAGLINE } from "@/lib/accounting/copy";
import { formatSwissDate, zurichToday } from "@/lib/accounting/format";

type Section = "overview" | "journal" | "chart" | "reports" | "budget" | "periods" | "settings";

const PERIOD_STORAGE = "organa.accounting.period";

function preferredPeriod(periods: Period[], current: string): string {
  if (current && periods.some((period) => period.id === current)) return current;
  const today = zurichToday();
  const covering = periods.find((period) => today >= period.startsOn && today <= period.endsOn);
  return covering?.id || periods[periods.length - 1]?.id || "";
}

const NAV = [
  { href: "/tableau-de-bord/comptabilite/journal", section: "journal" as const, label: "Journal" },
  { href: "/tableau-de-bord/comptabilite/plan", section: "chart" as const, label: "Plan comptable" },
  { href: "/tableau-de-bord/comptabilite/rapports", section: "reports" as const, label: "Rapports" },
  { href: "/tableau-de-bord/comptabilite/budget", section: "budget" as const, label: "Budget" },
  { href: "/tableau-de-bord/comptabilite/exercices", section: "periods" as const, label: "Exercices" },
  { href: "/tableau-de-bord/comptabilite/parametres", section: "settings" as const, label: "Paramètres" },
];

export default function AccountingScreen({ section }: { section: Section }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodId, setPeriodId] = useState("");

  useEffect(() => {
    const stored = window.sessionStorage.getItem(PERIOD_STORAGE) || "";
    if (stored) setPeriodId(stored);
  }, []);

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
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body.error || "Action impossible";
      setError(message);
      return { error: message };
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
    startMode?: string | null;
    historyImportStatus?: string | null;
    numberingNotice?: string | null;
    stripePayoutAccountId?: string | null;
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
  const activePeriodId = preferredPeriod(periods, periodId);

  return (
    <PageLayout maxWidth="full" stack="compact">
      <PageHeader title="Comptabilité" subtitle={<p>{ACCOUNTING_TAGLINE}</p>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-xl border border-[#D6DEE8] bg-white p-1">
        {NAV.map((item) => {
          const active = item.section === section;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${active ? "bg-[#0F172A] font-semibold text-white" : "text-[#475569] hover:bg-[#F4F7FB]"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {periods.length > 0 ? (
        <label className="ml-auto text-sm text-[#64748B]">
          <span className="sr-only">Exercice affiché</span>
          <select
            aria-label="Exercice affiché"
            className="h-9 rounded-lg border border-[#D6DEE8] bg-white px-2 text-sm text-[#0F172A]"
            value={activePeriodId}
            onChange={(event) => {
              setPeriodId(event.target.value);
              window.sessionStorage.setItem(PERIOD_STORAGE, event.target.value);
            }}
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                Exercice {period.label}{period.status === "closed" ? " · clôturé" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {startsLater ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Votre comptabilité Obillz commencera le {formatSwissDate(access.startDate)}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475569]">Les encaissements et les dépenses antérieurs à cette date ne sont pas comptabilisés.</p>
        </GlassCard>
      ) : null}
      {section === "journal" ? (
        <JournalGrid
          entries={entries}
          accounts={accounts}
          linesByEntry={linesByEntry}
          periods={periods}
          selectedPeriodId={activePeriodId}
          attachments={attachments}
          inbox={review.inbox}
          canWrite={Boolean(access.canWrite)}
          numberingNotice={access.numberingNotice}
          onAct={async (payload) => {
            const result = await act(payload);
            if (payload.action === "journal-save" && result && typeof result === "object" && "error" in result) setError(null);
            return result;
          }}
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
          groups={(data?.groups || []) as AccountGroup[]}
          extensionsReady={data?.extensionsReady !== false}
          onAct={act}
        />
      ) : null}
      {section === "reports" ? (
        <ReportsPanel entries={entries} accounts={accounts} linesByEntry={linesByEntry} periods={periods} periodId={activePeriodId} groups={(data?.groups || []) as AccountGroup[]} coverageNote={coverage.note} />
      ) : null}
      {section === "budget" ? (
        <BudgetPanel
          accounts={accounts}
          groups={(data?.groups || []) as AccountGroup[]}
          budgets={(data?.budgets || []) as BudgetRecord[]}
          entries={entries}
          linesByEntry={linesByEntry}
          periods={periods}
          periodId={activePeriodId}
          canWrite={Boolean(access.canManage)}
          extensionsReady={data?.extensionsReady !== false}
          onAct={act}
        />
      ) : null}
      {section === "periods" ? (
        <PeriodsPanel
          periods={periods}
          selectedPeriodId={activePeriodId}
          openItems={openItems}
          canWrite={Boolean(access.canWrite)}
          startDate={access.startDate}
          historyPending={access.startMode === "resume_current" && access.historyImportStatus !== "applied"}
          onSelect={(id) => {
            setPeriodId(id);
            window.sessionStorage.setItem(PERIOD_STORAGE, id);
          }}
          onAct={act}
        />
      ) : null}
      {section === "settings" ? (
        <SettingsPanel
          autoValidate={Boolean(access.autoValidate)}
          startDate={access.startDate}
          canWrite={Boolean(access.canWrite)}
          payoutAccountId={access.stripePayoutAccountId}
          bankAccounts={accounts
            .filter((account) => account.isActive && isBankSystemCode(account.systemCode))
            .map((account) => ({ id: account.id, number: account.number, name: account.name }))}
          onAct={act}
        />
      ) : null}
    </PageLayout>
  );
}
