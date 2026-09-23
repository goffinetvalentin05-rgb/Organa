"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { PageHeader, PageLayout, GlassCard, ActionButton } from "@/components/ui";
import AccountingLanding from "@/components/accounting/AccountingLanding";
import { accountingPriceDetail, accountingPriceLabel } from "@/lib/billing/pricing";
import { ACCOUNTING_SCOPE_NOTE, ACCOUNTING_TAGLINE, OPENING_HELP } from "@/lib/accounting/copy";
import { ACCOUNT_CLASS_LABELS } from "@/lib/accounting/chart";
import { formatChfAmount, formatSwissDate, formatSwissDateLong } from "@/lib/accounting/format";
import { sourceHref, sourceLabel } from "@/lib/accounting/sources";

type Section = "overview" | "journal" | "review" | "chart" | "reports" | "periods" | "settings";

type Account = {
  id: string;
  number: string;
  name: string;
  accountType: string;
  accountClass: number;
  systemCode: string | null;
  isActive: boolean;
};

type Entry = {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  amount: number;
  direction: string;
  source_type: string;
  source_id: string | null;
  status: string;
  party_name: string | null;
  counter_account_id: string | null;
  category_account_id: string | null;
  reversed_by_entry_id: string | null;
};

type InboxItem = {
  id: string;
  description: string;
  amount: number;
  entry_date: string;
  status: string;
  source_type: string;
  source_id: string;
  party_name: string | null;
  direction: string;
  financial_account_code: string | null;
  category_code: string | null;
};

const NAV = [
  { href: "/tableau-de-bord/comptabilite", section: "overview" as const, label: "Vue d’ensemble" },
  { href: "/tableau-de-bord/comptabilite/journal", section: "journal" as const, label: "Journal" },
  { href: "/tableau-de-bord/comptabilite/a-verifier", section: "review" as const, label: "À vérifier" },
  { href: "/tableau-de-bord/comptabilite/plan", section: "plan" as const, label: "Plan comptable" },
  { href: "/tableau-de-bord/comptabilite/rapports", section: "reports" as const, label: "Rapports" },
  { href: "/tableau-de-bord/comptabilite/exercices", section: "periods" as const, label: "Exercices" },
  { href: "/tableau-de-bord/comptabilite/parametres", section: "settings" as const, label: "Paramètres" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "À vérifier",
  validated: "Validée",
  reversed: "Paiement annulé",
  voided: "Écartée",
  awaiting_account: "Compte à confirmer",
  awaiting_category: "Catégorie à confirmer",
  awaiting_details: "Compte et catégorie à confirmer",
  blocked_closed_period: "Exercice clôturé",
};

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
        if (!ok) {
          setError(body.error || "Impossible de charger la comptabilité");
        } else {
          setData(body);
        }
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
      return;
    }
    await reload();
  }

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title="Comptabilité" subtitle={ACCOUNTING_TAGLINE} />
      </PageLayout>
    );
  }

  const access = (data?.access || {}) as {
    entitled?: boolean;
    grant?: "stripe" | "founder" | "developer" | null;
    onboarded?: boolean;
    canWrite?: boolean;
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
        <Onboarding
          priceLabel={priceLabel}
          included={access.grant === "founder" || access.grant === "developer"}
          onDone={act}
        />
      </PageLayout>
    );
  }

  const accounts = (data?.accounts || []) as Account[];
  const entries = (data?.entries || []) as Entry[];
  const summary = (data?.summary || {}) as Record<string, number>;
  const review = (data?.review || { count: 0, amount: 0, inbox: [], entries: [] }) as {
    count: number;
    amount: number;
    inbox: InboxItem[];
    entries: Entry[];
  };
  const periods = (data?.periods || []) as Array<{ id: string; label: string; startsOn: string; endsOn: string; status: string }>;
  const linesByEntry = (data?.linesByEntry || {}) as Record<string, Array<{ accountId: string; debit: number; credit: number }>>;
  const openItems = data?.openItems as {
    receivableTotal: number;
    payableTotal: number;
    receivables: Array<{ id: string; title?: string; numero?: string; total_ttc: number }>;
    payables: Array<{ id: string; description: string; amount: number }>;
  } | null;

  return (
    <PageLayout>
      <PageHeader
        title="Comptabilité"
        subtitle={<p>{ACCOUNTING_TAGLINE}</p>}
      />
      <nav className="flex flex-wrap gap-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm ${
              item.section === section
                ? "bg-[#1A23FF] font-semibold text-white"
                : "bg-[#F1F5F9] text-[#475569]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {section === "overview" ? (
        <Overview summary={summary} review={review} accounts={accounts} entries={entries} />
      ) : null}
      {section === "journal" ? (
        <Journal entries={entries} accounts={accounts} linesByEntry={linesByEntry} periods={periods} />
      ) : null}
      {section === "review" ? (
        <Review
          review={review}
          accounts={accounts}
          linesByEntry={linesByEntry}
          canWrite={Boolean(access.canWrite)}
          onAct={act}
        />
      ) : null}
      {section === "chart" ? <Chart accounts={accounts} canWrite={Boolean(access.canWrite)} onAct={act} /> : null}
      {section === "reports" ? <Reports summary={summary} entries={entries} accounts={accounts} /> : null}
      {section === "periods" ? (
        <Periods periods={periods} openItems={openItems} canWrite={Boolean(access.canWrite)} onAct={act} />
      ) : null}
      {section === "settings" ? (
        <Settings
          autoValidate={Boolean(access.autoValidate)}
          startDate={access.startDate}
          canWrite={Boolean(access.canWrite)}
          onAct={act}
        />
      ) : null}
    </PageLayout>
  );
}

function Onboarding({
  priceLabel,
  included,
  onDone,
}: {
  priceLabel: string;
  included: boolean;
  onDone: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(`${new Date().getFullYear()}-12-31`);
  const [bank, setBank] = useState("0");
  const [cash, setCash] = useState("0");
  const [stripe, setStripe] = useState("0");
  const [includeExisting, setIncludeExisting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [others, setOthers] = useState<Array<{ accountCode: string; amount: string; side: "asset" | "liability" }>>([]);

  return (
    <GlassCard>
      <h2 className="text-xl font-semibold">Démarrer la comptabilité</h2>
      <p className="mt-2 text-sm text-[#64748B]">
        {OPENING_HELP} {included ? "Accès inclus pour ce club." : `Option ${priceLabel}.`}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Date de début
          <input className="mt-1 w-full rounded-xl border px-3 py-2" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="text-sm">Date de fin
          <input className="mt-1 w-full rounded-xl border px-3 py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="text-sm">Banque (CHF)
          <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="decimal" value={bank} onChange={(e) => setBank(e.target.value)} />
        </label>
        <label className="text-sm">Caisse (CHF)
          <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="decimal" value={cash} onChange={(e) => setCash(e.target.value)} />
        </label>
        <label className="text-sm">Stripe (CHF)
          <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="decimal" value={stripe} onChange={(e) => setStripe(e.target.value)} />
        </label>
      </div>
      <p className="mt-4 text-sm text-[#475569]">
        Exemple au {formatSwissDate(startDate)} : Banque {formatChfAmount(Number(bank) || 0)}, Caisse {formatChfAmount(Number(cash) || 0)}, Stripe {formatChfAmount(Number(stripe) || 0)}. Un montant à 0 est accepté.
      </p>
      <div className="mt-4">
        <p className="text-sm font-medium">Autres éléments du patrimoine (optionnel)</p>
        {others.map((row, index) => (
          <div key={index} className="mt-2 grid gap-2 sm:grid-cols-3">
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="N° de compte, ex. 1500"
              value={row.accountCode}
              onChange={(event) => {
                const next = [...others];
                next[index] = { ...row, accountCode: event.target.value };
                setOthers(next);
              }}
            />
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Montant"
              value={row.amount}
              onChange={(event) => {
                const next = [...others];
                next[index] = { ...row, amount: event.target.value };
                setOthers(next);
              }}
            />
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={row.side}
              onChange={(event) => {
                const next = [...others];
                next[index] = { ...row, side: event.target.value === "liability" ? "liability" : "asset" };
                setOthers(next);
              }}
            >
              <option value="asset">Actif</option>
              <option value="liability">Passif</option>
            </select>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 text-sm text-[#1A23FF]"
          onClick={() => setOthers([...others, { accountCode: "", amount: "0", side: "asset" }])}
        >
          Ajouter un autre élément
        </button>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={includeExisting} onChange={(e) => setIncludeExisting(e.target.checked)} />
        Comptabiliser les paiements déjà enregistrés depuis cette date, après confirmation.
      </label>
      <p className="mt-4 text-xs text-[#64748B]">{ACCOUNTING_SCOPE_NOTE}</p>
      <div className="mt-6">
        <ActionButton
          type="button"
          variant="premiumInline"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void onDone({
              action: "onboarding",
              startDate,
              endDate,
              bank: Number(bank) || 0,
              cash: Number(cash) || 0,
              stripe: Number(stripe) || 0,
              others: others
                .filter((row) => row.accountCode.trim() && Number(row.amount) > 0)
                .map((row) => ({
                  accountCode: row.accountCode.trim(),
                  amount: Number(row.amount) || 0,
                  side: row.side,
                })),
              includeExisting,
            }).finally(() => setBusy(false));
          }}
        >
          Utiliser le plan recommandé
        </ActionButton>
      </div>
    </GlassCard>
  );
}

function Overview({
  summary,
  review,
  accounts,
  entries,
}: {
  summary: Record<string, number>;
  review: { count: number; amount: number };
  accounts: Account[];
  entries: Entry[];
}) {
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      if (entry.status !== "validated" || entry.direction !== "in") continue;
      const account = accounts.find((item) => item.id === entry.category_account_id);
      const name = account?.name || "Autres";
      map.set(name, (map.get(name) || 0) + Number(entry.amount));
    }
    return [...map.entries()];
  }, [accounts, entries]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenus validés" value={formatChfAmount(summary.revenue || 0)} />
        <Stat label="Charges validées" value={formatChfAmount(summary.expense || 0)} />
        <Stat label="Résultat" value={formatChfAmount(summary.result || 0)} />
        <Stat label="Banque / caisse / Stripe" value={formatChfAmount(summary.treasury || 0)} />
      </div>
      <GlassCard padding="sm">
        <p className="text-sm font-semibold text-[#0F172A]">À vérifier</p>
        <p className="mt-1 text-sm text-[#475569]">
          {review.count} opération{review.count > 1 ? "s" : ""} · {formatChfAmount(review.amount || 0)}
        </p>
        <p className="mt-2 text-xs text-[#64748B]">Ces montants ne modifient pas les chiffres validés.</p>
      </GlassCard>
      <GlassCard padding="sm">
        <p className="text-sm font-semibold">Répartition des revenus validés</p>
        <ul className="mt-3 space-y-2">
          {byCategory.length === 0 ? <li className="text-sm text-[#64748B]">Aucun revenu validé.</li> : null}
          {byCategory.map(([name, amount]) => (
            <li key={name} className="flex justify-between text-sm">
              <span>{name}</span>
              <span>{formatChfAmount(amount)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[#64748B]">
          Banque {formatChfAmount(summary.bank || 0)} · Caisse {formatChfAmount(summary.cash || 0)} · Stripe {formatChfAmount(summary.stripe || 0)}
        </p>
      </GlassCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard padding="sm">
      <p className="text-xs uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#0F172A]">{value}</p>
    </GlassCard>
  );
}

function Journal({
  entries,
  accounts,
  linesByEntry,
  periods,
}: {
  entries: Entry[];
  accounts: Account[];
  linesByEntry: Record<string, Array<{ accountId: string; debit: number; credit: number }>>;
  periods: Array<{ id: string; label: string }>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const visible = entries.filter((entry) => {
    if (entry.status === "pending" || entry.status === "voided") return false;
    if (status !== "all" && entry.status !== status) return false;
    const blob = `${entry.description} ${entry.party_name || ""}`.toLowerCase();
    return blob.includes(query.toLowerCase());
  });

  return (
    <GlassCard padding="sm">
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="rounded-xl border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tous les statuts du journal</option>
          <option value="validated">Validée</option>
          <option value="reversed">Paiement annulé</option>
        </select>
        <span className="text-xs text-[#64748B]">{periods.map((period) => period.label).join(" · ")}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-[#64748B]">
            <tr>
              <th className="py-2">Date</th>
              <th>N°</th>
              <th>Libellé</th>
              <th>Compte / catégorie</th>
              <th>Entrée</th>
              <th>Sortie</th>
              <th>Source</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => (
              <EntryRows key={entry.id} entry={entry} accounts={accounts} lines={linesByEntry[entry.id] || []} />
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function EntryRows({
  entry,
  accounts,
  lines,
  actions,
}: {
  entry: Entry;
  accounts: Account[];
  lines: Array<{ accountId: string; debit: number; credit: number }>;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const category = accounts.find((account) => account.id === entry.category_account_id);
  const counter = accounts.find((account) => account.id === entry.counter_account_id);
  const href = sourceHref(entry.source_type, entry.source_id);
  const incoming = entry.direction === "in" || entry.direction === "opening";
  return (
    <>
      <tr className="border-t border-[#E2E8F0]">
        <td className="py-3">{formatSwissDate(entry.entry_date)}</td>
        <td>{entry.entry_number}</td>
        <td>
          <div className="font-medium">{entry.party_name || entry.description}</div>
          <div className="text-xs text-[#64748B]">{formatSwissDateLong(entry.entry_date)}</div>
        </td>
        <td>{counter?.name || "Compte"} → {category?.name || "Catégorie"}</td>
        <td>{incoming ? formatChfAmount(Number(entry.amount)) : ""}</td>
        <td>{!incoming ? formatChfAmount(Number(entry.amount)) : ""}</td>
        <td>
          {href ? <Link className="text-[#1A23FF]" href={href}>{sourceLabel(entry.source_type)}</Link> : sourceLabel(entry.source_type)}
        </td>
        <td>{entry.status === "reversed" ? "Paiement annulé" : STATUS_LABEL[entry.status] || entry.status}</td>
      </tr>
      <tr>
        <td colSpan={8} className="pb-3">
          <button type="button" className="text-xs text-[#1A23FF]" onClick={() => setOpen((value) => !value)}>
            {open ? "Masquer les détails comptables" : "Afficher les détails comptables"}
          </button>
          {actions}
          {open ? (
            <ul className="mt-2 space-y-1 text-xs text-[#475569]">
              {lines.map((line, index) => {
                const account = accounts.find((item) => item.id === line.accountId);
                return (
                  <li key={`${entry.id}-${index}`}>
                    {line.debit > 0 ? "Débit" : "Crédit"} {account?.number} {account?.name} {formatChfAmount(line.debit || line.credit)}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </td>
      </tr>
    </>
  );
}

function Review({
  review,
  accounts,
  linesByEntry,
  canWrite,
  onAct,
}: {
  review: { inbox: InboxItem[]; entries: Entry[] };
  accounts: Account[];
  linesByEntry: Record<string, Array<{ accountId: string; debit: number; credit: number }>>;
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const financial = accounts.filter((account) => ["bank", "cash", "stripe"].includes(account.systemCode || "") || (account.accountType === "asset" && account.isActive));
  const categories = accounts.filter((account) => account.accountType === "revenue" || account.accountType === "expense");

  return (
    <div className="space-y-4">
      {review.inbox.map((item) => (
        <ConfirmCard key={item.id} item={item} financial={financial} categories={categories} canWrite={canWrite} onAct={onAct} />
      ))}
      {review.entries.map((entry) => (
        <GlassCard key={entry.id} padding="sm">
          <p className="font-medium">{entry.party_name || entry.description}</p>
          <p className="text-sm">{formatChfAmount(Number(entry.amount))} · {formatSwissDateLong(entry.entry_date)}</p>
          <p className="text-xs text-[#64748B]">À vérifier · ces montants restent hors des rapports.</p>
          <ul className="mt-2 text-xs text-[#475569]">
            {(linesByEntry[entry.id] || []).map((line, index) => {
              const account = accounts.find((item) => item.id === line.accountId);
              return (
                <li key={index}>
                  {line.debit > 0 ? "Débit" : "Crédit"} {account?.number} {account?.name}
                </li>
              );
            })}
          </ul>
          {canWrite ? (
            <div className="mt-3 flex gap-2">
              <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "validate", entryId: entry.id })}>Valider</ActionButton>
              <ActionButton type="button" variant="ghost" onClick={() => void onAct({ action: "void", entryId: entry.id })}>Écarter</ActionButton>
              <Attach entryId={entry.id} />
            </div>
          ) : null}
        </GlassCard>
      ))}
      {review.inbox.length === 0 && review.entries.length === 0 ? (
        <GlassCard><p className="text-sm text-[#64748B]">Aucune opération à vérifier.</p></GlassCard>
      ) : null}
      {canWrite ? <ManualForm accounts={accounts} onAct={onAct} /> : null}
    </div>
  );
}

function ConfirmCard({
  item,
  financial,
  categories,
  canWrite,
  onAct,
}: {
  item: InboxItem;
  financial: Account[];
  categories: Account[];
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [financialCode, setFinancialCode] = useState(item.financial_account_code || "");
  const [categoryCode, setCategoryCode] = useState(item.category_code || "");
  const filteredCategories = categories.filter((account) =>
    item.direction === "out" ? account.accountType === "expense" : account.accountType === "revenue"
  );
  const href = sourceHref(item.source_type, item.source_id);
  return (
    <GlassCard padding="sm">
      <p className="text-xs font-semibold uppercase text-[#1A23FF]">{STATUS_LABEL[item.status] || "À confirmer"}</p>
      <p className="mt-1 font-medium">{item.party_name || item.description}</p>
      <p className="text-sm">{formatChfAmount(Number(item.amount))} · {formatSwissDateLong(item.entry_date)}</p>
      {href ? <Link className="text-sm text-[#1A23FF]" href={href}>Voir la source</Link> : null}
      {canWrite ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Où avez-vous reçu ou payé ce montant ?
            <select className="mt-1 w-full rounded-xl border px-3 py-2" value={financialCode} onChange={(e) => setFinancialCode(e.target.value)}>
              <option value="">Choisir</option>
              {financial.map((account) => (
                <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">Catégorie
            <select className="mt-1 w-full rounded-xl border px-3 py-2" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)}>
              <option value="">Choisir</option>
              {filteredCategories.map((account) => (
                <option key={account.id} value={account.systemCode || account.number}>{account.name}</option>
              ))}
            </select>
          </label>
          <ActionButton
            type="button"
            variant="premiumInline"
            onClick={() => void onAct({
              action: "confirm",
              inboxId: item.id,
              financialAccountCode: financialCode,
              categoryCode,
            })}
          >
            Proposer l’écriture
          </ActionButton>
        </div>
      ) : null}
    </GlassCard>
  );
}

function ManualForm({
  accounts,
  onAct,
}: {
  accounts: Account[];
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [financialAccountCode, setFinancial] = useState("bank");
  const [categoryCode, setCategory] = useState(direction === "in" ? "other_income" : "other_expense");

  return (
    <GlassCard padding="sm">
      <p className="font-semibold">{direction === "in" ? "Ajouter un encaissement" : "Ajouter une dépense"}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="text-sm underline" onClick={() => { setDirection("in"); setCategory("other_income"); }}>Encaissement</button>
        <button type="button" className="text-sm underline" onClick={() => { setDirection("out"); setCategory("other_expense"); }}>Dépense</button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input className="rounded-xl border px-3 py-2 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="rounded-xl border px-3 py-2 text-sm sm:col-span-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select className="rounded-xl border px-3 py-2 text-sm" value={financialAccountCode} onChange={(e) => setFinancial(e.target.value)}>
          {accounts.filter((account) => account.systemCode === "bank" || account.systemCode === "cash" || account.systemCode === "stripe").map((account) => (
            <option key={account.id} value={account.systemCode || ""}>{account.name}</option>
          ))}
        </select>
        <select className="rounded-xl border px-3 py-2 text-sm" value={categoryCode} onChange={(e) => setCategory(e.target.value)}>
          {accounts.filter((account) => account.accountType === (direction === "in" ? "revenue" : "expense")).map((account) => (
            <option key={account.id} value={account.systemCode || ""}>{account.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-3">
        <ActionButton
          type="button"
          variant="premiumInline"
          onClick={() => void onAct({
            action: "manual",
            direction,
            date,
            amount: Number(amount),
            description,
            financialAccountCode,
            categoryCode,
          })}
        >
          Enregistrer
        </ActionButton>
      </div>
    </GlassCard>
  );
}

function Attach({ entryId }: { entryId: string }) {
  return (
    <label className="text-sm text-[#1A23FF]">
      Joindre une pièce
      <input
        className="mt-1 block text-xs"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const form = new FormData();
          form.set("entryId", entryId);
          form.set("file", file);
          void fetch("/api/accounting", { method: "PUT", body: form });
        }}
      />
    </label>
  );
}

function Chart({
  accounts,
  canWrite,
  onAct,
}: {
  accounts: Account[];
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("expense");
  const groups = [1, 2, 3, 4, 5, 6];
  return (
    <div className="space-y-4">
      {groups.map((accountClass) => (
        <GlassCard key={accountClass} padding="sm">
          <p className="font-semibold">{ACCOUNT_CLASS_LABELS[accountClass]}</p>
          <table className="mt-2 w-full text-sm">
            <thead className="text-xs uppercase text-[#64748B]"><tr><th className="text-left">N°</th><th className="text-left">Compte</th><th className="text-left">Type</th><th>Statut</th></tr></thead>
            <tbody>
              {accounts.filter((account) => account.accountClass === accountClass).map((account) => (
                <tr key={account.id} className="border-t">
                  <td className="py-2">{account.number}</td>
                  <td>{account.name}</td>
                  <td>{account.accountType}</td>
                  <td>{account.isActive ? "Actif" : "Inactif"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ))}
      {canWrite ? (
        <GlassCard padding="sm">
          <p className="font-semibold">Nouveau compte</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Numéro" value={number} onChange={(e) => setNumber(e.target.value)} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              <option value="asset">Actif</option>
              <option value="liability">Passif</option>
              <option value="equity">Capitaux propres</option>
              <option value="revenue">Produit</option>
              <option value="expense">Charge</option>
            </select>
            <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "create_account", number, name, accountType })}>Créer</ActionButton>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}

function Reports({
  summary,
  entries,
  accounts,
}: {
  summary: Record<string, number>;
  entries: Entry[];
  accounts: Account[];
}) {
  function downloadCsv() {
    const header = ["Date", "N°", "Libellé", "Entrée", "Sortie", "Statut", "Source"];
    const rows = entries
      .filter((entry) => entry.status === "validated" || entry.status === "reversed")
      .map((entry) => [
        formatSwissDate(entry.entry_date),
        entry.entry_number,
        entry.description,
        entry.direction === "in" ? entry.amount : "",
        entry.direction === "out" ? entry.amount : "",
        entry.status,
        entry.source_type,
      ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "journal-comptable.csv";
    link.click();
    URL.revokeObjectURL(url);
    void fetch("/api/accounting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export", kind: "csv" }),
    });
  }

  const revenueAccounts = accounts.filter((account) => account.accountType === "revenue");
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-lg font-semibold">Compte de résultat</h2>
        <p className="mt-2 text-sm">Produits {formatChfAmount(summary.revenue || 0)}</p>
        <p className="text-sm">Charges {formatChfAmount(summary.expense || 0)}</p>
        <p className="mt-2 font-semibold">Résultat {formatChfAmount(summary.result || 0)}</p>
        <p className="mt-4 text-xs text-[#64748B]">Chiffres validés uniquement. {revenueAccounts.length} comptes de produits au plan.</p>
      </GlassCard>
      <GlassCard>
        <h2 className="text-lg font-semibold">Bilan de trésorerie</h2>
        <p className="mt-2 text-sm">Banque {formatChfAmount(summary.bank || 0)}</p>
        <p className="text-sm">Caisse {formatChfAmount(summary.cash || 0)}</p>
        <p className="text-sm">Stripe {formatChfAmount(summary.stripe || 0)}</p>
      </GlassCard>
      <div className="flex gap-3">
        <a className="rounded-full bg-[#1A23FF] px-4 py-2 text-sm font-semibold text-white" href="/api/accounting/pdf">PDF</a>
        <button type="button" className="rounded-full bg-[#F1F5F9] px-4 py-2 text-sm" onClick={downloadCsv}>CSV / Excel</button>
      </div>
    </div>
  );
}

function Periods({
  periods,
  openItems,
  canWrite,
  onAct,
}: {
  periods: Array<{ id: string; label: string; startsOn: string; endsOn: string; status: string }>;
  openItems: {
    receivableTotal: number;
    payableTotal: number;
    receivables: Array<{ id: string; title?: string; numero?: string; total_ttc: number }>;
    payables: Array<{ id: string; description: string; amount: number }>;
  } | null;
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [transfer, setTransfer] = useState(false);
  return (
    <div className="space-y-4">
      {periods.map((period) => (
        <GlassCard key={period.id} padding="sm">
          <p className="font-semibold">{period.label} · {formatSwissDate(period.startsOn)} – {formatSwissDate(period.endsOn)}</p>
          <p className="text-sm">{period.status === "closed" ? "Clôturé" : "Ouvert"}</p>
          {canWrite && period.status === "open" ? (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={transfer} onChange={(e) => setTransfer(e.target.checked)} />
                Reporter le résultat sur le compte 2900 après confirmation
              </label>
              <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "close", periodId: period.id, transferResult: transfer })}>
                Clôturer l’exercice
              </ActionButton>
            </div>
          ) : null}
          {canWrite && period.status === "closed" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Motif de réouverture" value={reason} onChange={(e) => setReason(e.target.value)} />
              <ActionButton type="button" variant="ghost" onClick={() => void onAct({ action: "reopen", periodId: period.id, reason })}>Rouvrir</ActionButton>
            </div>
          ) : null}
        </GlassCard>
      ))}
      {openItems ? (
        <GlassCard>
          <h2 className="font-semibold">Postes ouverts</h2>
          <p className="mt-2 text-sm">Clients et membres qui doivent encore payer : {formatChfAmount(openItems.receivableTotal)}</p>
          <p className="text-sm">Factures fournisseurs non payées : {formatChfAmount(openItems.payableTotal)}</p>
          <p className="mt-2 text-xs text-[#64748B]">Ces postes ne sont pas des écritures. Ils restent visibles à part.</p>
        </GlassCard>
      ) : null}
    </div>
  );
}

function Settings({
  autoValidate,
  startDate,
  canWrite,
  onAct,
}: {
  autoValidate: boolean;
  startDate?: string | null;
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <GlassCard>
      <p className="text-sm">Date de départ : {startDate ? formatSwissDate(startDate) : "—"}</p>
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoValidate}
          disabled={!canWrite}
          onChange={(event) => void onAct({ action: "settings", autoValidate: event.target.checked })}
        />
        <span>
          Valider automatiquement les écritures générées par Obillz
          <span className="mt-1 block text-xs text-[#64748B]">
            Uniquement lorsque le montant, la date, le compte financier, la catégorie et la source sont certains. Une hypothèse n’est jamais validée.
          </span>
        </span>
      </label>
      <p className="mt-6 text-xs leading-relaxed text-[#64748B]">{ACCOUNTING_SCOPE_NOTE}</p>
    </GlassCard>
  );
}
