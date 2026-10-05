"use client";

import { useMemo, useState } from "react";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { parseChfInput } from "@/lib/accounting/onboarding";
import { buildBalanceSheet, buildIncomeStatement } from "@/lib/accounting/reports";
import {
  TAKEOVER_CSV_HELP,
  TAKEOVER_CSV_TEMPLATE,
  chartTakeoverAccounts,
  parseTakeoverCsv,
  planTakeover,
  type TakeoverAccount,
  type TakeoverMode,
  type TakeoverOpenItem,
} from "@/lib/accounting/takeover";
import { ActionButton, GlassCard } from "@/components/ui";

const fieldClass = "mt-1 w-full rounded-xl border border-[rgba(15,23,42,0.1)] px-3 py-2 text-sm";

const HELP: Record<string, string> = {
  cash: "Argent liquide du club.",
  bank: "Compte bancaire principal.",
  stripe: "Montants encaissés via Stripe et pas encore versés sur la banque.",
  debtors: "Factures et cotisations déjà dues, pas encore encaissées.",
  creditors: "Factures reçues, pas encore payées.",
  prepaid: "Charges payées d'avance ou produits à recevoir.",
  accrued: "Produits encaissés d'avance ou charges à payer.",
  inventory: "Articles encore en stock.",
  fixed_assets: "Matériel et biens durables.",
  equity: "Fortune de l'association au début de la reprise.",
  retained: "Résultat des exercices précédents déjà affecté.",
};

export default function AccountingOnboarding({
  usesStripe,
  onDone,
}: {
  usesStripe: boolean;
  onDone: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const year = new Date().getFullYear();
  const accounts = useMemo(() => chartTakeoverAccounts().filter((account) => usesStripe || account.code !== "stripe"), [usesStripe]);
  const [step, setStep] = useState(1);
  const [periodStart, setPeriodStart] = useState(`${year}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(`${year}-12-31`);
  const [takeoverDate, setTakeoverDate] = useState(`${year}-01-01`);
  const [mode, setMode] = useState<TakeoverMode | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [legacyNumbers, setLegacyNumbers] = useState<Record<string, string>>({});
  const [customs, setCustoms] = useState<TakeoverAccount[]>([]);
  const [customNumber, setCustomNumber] = useState("");
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<TakeoverAccount["accountType"]>("liability");
  const [withCumulatives, setWithCumulatives] = useState(false);
  const [cumulatives, setCumulatives] = useState<Record<string, string>>({});
  const [csv, setCsv] = useState("");
  const [items, setItems] = useState<TakeoverOpenItem[]>([]);
  const [confirmEquity, setConfirmEquity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const catalog = [...accounts, ...customs];
  const balanceAccounts = catalog.filter((account) => account.accountType === "asset" || account.accountType === "liability" || account.accountType === "equity");
  const resultAccounts = catalog.filter((account) => account.accountType === "revenue" || account.accountType === "expense");

  const parsedCsv = useMemo(() => (csv.trim() ? parseTakeoverCsv(csv) : null), [csv]);

  const draft = useMemo(() => {
    if (!mode) return null;
    return planTakeover({
      mode,
      periodStart,
      periodEnd,
      takeoverDate,
      accounts: catalog,
      confirmEquityProposal: confirmEquity,
      balances: balanceAccounts.flatMap((account) => {
        const amount = parseChfInput(amounts[account.code] || "");
        if (!amount) return [];
        return [{ code: account.code, amount, legacyNumber: legacyNumbers[account.code] || undefined }];
      }),
      cumulatives: mode === "from_date" && withCumulatives
        ? resultAccounts.flatMap((account) => {
            const amount = parseChfInput(cumulatives[account.code] || "");
            return amount ? [{ code: account.code, amount }] : [];
          })
        : [],
      journal: mode === "full_period" && parsedCsv?.ok ? parsedCsv.entries : [],
      openItems: items,
    });
  }, [amounts, balanceAccounts, catalog, confirmEquity, cumulatives, items, legacyNumbers, mode, parsedCsv, periodEnd, periodStart, resultAccounts, takeoverDate, withCumulatives]);

  const preview = useMemo(() => {
    if (!draft?.ok) return null;
    const reportAccounts = catalog.map((account) => ({
      id: account.code,
      number: account.number,
      name: account.name,
      accountType: account.accountType,
      accountClass: Number(account.number[0]) || 1,
    }));
    const entries = [];
    const linesByEntry: Record<string, Array<{ accountId: string; debit: number; credit: number }>> = {};
    if (draft.openingLines.length) {
      entries.push({ id: "opening", entry_number: 1, entry_date: draft.openingDate, description: draft.openingDescription, status: "validated", source_type: "opening", event_type: "opening" });
      linesByEntry.opening = draft.openingLines.map((line) => ({ accountId: line.accountCode, debit: line.debit, credit: line.credit }));
    }
    draft.journal.forEach((entry, index) => {
      const id = `journal-${index}`;
      entries.push({ id, entry_number: index + 2, entry_date: entry.date, description: entry.label, status: "validated", reference: entry.piece, source_type: "import", event_type: "import" });
      linesByEntry[id] = entry.lines.map((line) => ({ accountId: line.code, debit: line.debit, credit: line.credit }));
    });
    if (draft.rollup) {
      entries.push({ id: "rollup", entry_number: 9000, entry_date: draft.rollup.date, description: draft.rollup.description, status: "validated", source_type: "history_rollup", event_type: "history_rollup" });
      linesByEntry.rollup = draft.rollup.lines.map((line) => ({ accountId: line.accountCode, debit: line.debit, credit: line.credit }));
    }
    const period = { label: periodStart.slice(0, 4), startsOn: periodStart, endsOn: periodEnd };
    return {
      balance: buildBalanceSheet({ accounts: reportAccounts, entries, linesByEntry, period }),
      income: buildIncomeStatement({
        accounts: reportAccounts,
        entries,
        linesByEntry,
        period,
        detailFrom: draft.incomeAnnual ? null : takeoverDate,
        coverageNote: draft.coverageNote,
      }),
    };
  }, [catalog, draft, periodEnd, periodStart, takeoverDate]);

  function payload() {
    return {
      action: "onboarding",
      takeoverMode: mode,
      periodStart,
      periodEnd,
      takeoverDate,
      confirmEquityProposal: confirmEquity,
      balances: balanceAccounts.flatMap((account) => {
        const amount = parseChfInput(amounts[account.code] || "");
        if (!amount) return [];
        return [{ code: account.code, amount, legacyNumber: legacyNumbers[account.code] || undefined }];
      }),
      customAccounts: customs.map((account) => ({ number: account.number, name: account.name, accountType: account.accountType })),
      cumulatives: mode === "from_date" && withCumulatives
        ? resultAccounts.flatMap((account) => {
            const amount = parseChfInput(cumulatives[account.code] || "");
            return amount ? [{ code: account.code, amount }] : [];
          })
        : [],
      journal: mode === "full_period" && parsedCsv?.ok ? parsedCsv.entries : [],
      openItems: items,
    };
  }

  function nextFromChoice() {
    setError(null);
    if (periodEnd < periodStart) return setError("La fin d'exercice précède le début.");
    if (takeoverDate < periodStart || takeoverDate > periodEnd) return setError("La date de reprise doit être comprise dans l'exercice.");
    if (!mode) return setError("Choisissez comment reprendre la comptabilité.");
    setStep(2);
  }

  function nextFromBalances() {
    setError(null);
    if (parsedCsv && !parsedCsv.ok) return setError(parsedCsv.message);
    if (!draft) return setError("Choisissez comment reprendre la comptabilité.");
    if (!draft.ok && !draft.equityProposal) return setError(draft.message);
    setStep(3);
  }

  async function confirm() {
    setError(null);
    if (!draft?.ok) {
      setError(draft?.message || "La reprise n'est pas prête.");
      return;
    }
    setBusy(true);
    try {
      await onDone(payload());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reprise impossible");
    } finally {
      setBusy(false);
    }
  }

  function addCustom() {
    setError(null);
    if (!/^\d{4}$/.test(customNumber) || !customName.trim()) {
      setError("Un compte ajouté a besoin d'un numéro à quatre chiffres et d'un nom.");
      return;
    }
    if (catalog.some((account) => account.number === customNumber)) {
      setError(`Le compte ${customNumber} existe déjà.`);
      return;
    }
    setCustoms([...customs, { code: customNumber, number: customNumber, name: customName.trim(), accountType: customType }]);
    setCustomNumber("");
    setCustomName("");
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {["Reprise et dates", "Soldes ou import", "Contrôle", "Confirmation"].map((label, index) => (
          <li key={label} className={`rounded-full px-3 py-1 text-xs font-medium ${step === index + 1 ? "bg-[#1A23FF] text-white" : index + 1 < step ? "bg-[#EEF2FF] text-[#1A23FF]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {step === 1 ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Comment reprendre la comptabilité</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475569]">
            La date d'inscription du club sur Obillz ne fixe ni l'exercice ni la reprise. Indiquez les dates de l'exercice, puis le jour où Obillz commence à enregistrer les nouvelles opérations.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <label className="text-sm text-[#334155]">Début d'exercice
              <input className={fieldClass} type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </label>
            <label className="text-sm text-[#334155]">Fin d'exercice
              <input className={fieldClass} type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
            <label className="text-sm text-[#334155]">Date de reprise
              <input className={fieldClass} type="date" value={takeoverDate} onChange={(event) => setTakeoverDate(event.target.value)} />
            </label>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ModeCard
              selected={mode === "full_period"}
              title="Reprendre tout l'exercice"
              text="Soldes du bilan au début de l'exercice, puis les écritures déjà passées depuis cette date. Si la reprise tombe le premier jour, seul le bilan final de l'exercice précédent est nécessaire."
              onClick={() => setMode("full_period")}
            />
            <ModeCard
              selected={mode === "from_date"}
              title="Continuer à partir d'une date"
              text="Soldes de bilan juste avant le passage, et seulement les nouvelles opérations ensuite. Les cumuls de charges et de produits restent facultatifs pour obtenir un total annuel."
              onClick={() => setMode("from_date")}
            />
          </div>
          <div className="mt-6">
            <ActionButton type="button" variant="premiumInline" onClick={nextFromChoice}>Continuer</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 2 ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">{mode === "full_period" ? "Soldes au début de l'exercice" : "Situation juste avant le passage"}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#475569]">
            {mode === "full_period"
              ? "Ces soldes ne sont pas les soldes d'aujourd'hui. Les écritures importées feront évoluer les comptes ensuite."
              : "Indiquez les soldes des comptes de bilan juste avant la date de reprise. Ce ne sont pas de nouveaux encaissements, charges ou revenus."}
          </p>
          <div className="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1">
            {balanceAccounts.map((account) => (
              <div key={account.code} className="grid gap-2 sm:grid-cols-[7rem_1fr_9rem_8rem] sm:items-end">
                <p className="text-sm font-medium text-[#0F172A]">{account.number}</p>
                <label className="text-sm text-[#334155]">{account.name}
                  <span className="mt-1 block text-xs text-[#64748B]">{HELP[account.code] || "Compte de bilan à reprendre s'il a un solde."}</span>
                </label>
                <label className="text-xs text-[#64748B]">Ancien n°
                  <input className={fieldClass} value={legacyNumbers[account.code] || ""} onChange={(event) => setLegacyNumbers({ ...legacyNumbers, [account.code]: event.target.value })} />
                </label>
                <label className="text-xs text-[#64748B]">Solde CHF
                  <input className={fieldClass} inputMode="decimal" value={amounts[account.code] || ""} onChange={(event) => setAmounts({ ...amounts, [account.code]: event.target.value })} />
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[7rem_1fr_10rem_auto] sm:items-end">
            <input className={fieldClass} placeholder="2400" value={customNumber} onChange={(event) => setCustomNumber(event.target.value)} />
            <input className={fieldClass} placeholder="Nom du compte, par exemple Emprunt" value={customName} onChange={(event) => setCustomName(event.target.value)} />
            <select className={fieldClass} value={customType} onChange={(event) => setCustomType(event.target.value as TakeoverAccount["accountType"])}>
              <option value="asset">Actif</option>
              <option value="liability">Passif</option>
              <option value="equity">Fonds propres</option>
            </select>
            <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={addCustom}>Ajouter le compte</button>
          </div>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-[#0F172A]">Sommes déjà à recevoir ou à payer</h3>
            <p className="mt-1 text-sm text-[#475569]">Leur total doit égaler le solde du compte. Le règlement ultérieur soldera cette somme, sans enregistrer une deuxième fois le produit ou la charge.</p>
            {items.map((item, index) => (
              <div key={index} className="mt-3 grid gap-2 sm:grid-cols-4">
                <input className={fieldClass} placeholder="Libellé" value={item.label} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row))} />
                <select className={fieldClass} value={item.code} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, code: event.target.value } : row))}>
                  {balanceAccounts.filter((account) => account.accountType === "asset" || account.accountType === "liability").map((account) => (
                    <option key={account.code} value={account.code}>{account.number} {account.name}</option>
                  ))}
                </select>
                <select className={fieldClass} value={item.side} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, side: event.target.value as TakeoverOpenItem["side"] } : row))}>
                  <option value="receivable">À recevoir</option>
                  <option value="payable">À payer</option>
                </select>
                <input className={fieldClass} inputMode="decimal" placeholder="CHF" value={String(item.amount || "")} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, amount: parseChfInput(event.target.value) || 0 } : row))} />
              </div>
            ))}
            <button type="button" className="mt-3 text-sm font-semibold text-[#1A23FF]" onClick={() => setItems([...items, { code: "debtors", label: "", amount: 0, side: "receivable" }])}>Ajouter une somme</button>
          </section>

          {mode === "from_date" ? (
            <section className="mt-8">
              <label className="flex items-start gap-2 text-sm text-[#0F172A]">
                <input type="checkbox" className="mt-1" checked={withCumulatives} onChange={(event) => setWithCumulatives(event.target.checked)} />
                Reprendre les cumuls de charges et de produits depuis le début de l'exercice, pour un total annuel.
              </label>
              {withCumulatives ? (
                <div className="mt-3 space-y-2">
                  {resultAccounts.map((account) => (
                    <label key={account.code} className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr_8rem] sm:items-center">
                      <span>{account.number}</span>
                      <span>{account.name}</span>
                      <input className={fieldClass} inputMode="decimal" value={cumulatives[account.code] || ""} onChange={(event) => setCumulatives({ ...cumulatives, [account.code]: event.target.value })} />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#475569]">Sans ces cumuls, le compte de résultat couvrira seulement la période depuis la reprise.</p>
              )}
            </section>
          ) : null}

          {mode === "full_period" && takeoverDate > periodStart ? (
            <section className="mt-8">
              <h3 className="text-sm font-semibold text-[#0F172A]">Écritures déjà enregistrées</h3>
              <p className="mt-1 text-sm text-[#475569]">{TAKEOVER_CSV_HELP}</p>
              <button type="button" className="mt-2 text-sm font-semibold text-[#1A23FF]" onClick={() => downloadTemplate()}>Télécharger le modèle CSV</button>
              <textarea className={`${fieldClass} mt-3 min-h-36 font-mono`} placeholder="Collez le CSV ou chargez le fichier" value={csv} onChange={(event) => setCsv(event.target.value)} />
              <input className="mt-2 block text-sm" type="file" accept=".csv,text/csv" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void file.text().then(setCsv);
              }} />
              {parsedCsv && !parsedCsv.ok ? <p className="mt-2 text-sm text-rose-700">{parsedCsv.message}</p> : null}
              {parsedCsv?.ok ? <p className="mt-2 text-sm text-[#475569]">{parsedCsv.entries.length} écriture{parsedCsv.entries.length > 1 ? "s" : ""} prête{parsedCsv.entries.length > 1 ? "s" : ""}.</p> : null}
            </section>
          ) : null}
          {mode === "full_period" && takeoverDate === periodStart ? (
            <p className="mt-6 text-sm text-[#475569]">La reprise tombe le premier jour de l'exercice. Le bilan final de l'exercice précédent suffit. Les opérations de l'année précédente ne sont pas importées.</p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => setStep(1)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={nextFromBalances}>Voir le contrôle</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 3 && draft ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Contrôle</h2>
          {draft.ok ? (
            <div className="mt-4 space-y-3 text-sm text-[#334155]">
              <p>{draft.coverageNote}</p>
              <p>{draft.journalScope}</p>
              <p>Écriture de reprise du {formatSwissDate(draft.openingDate)} : {draft.openingDescription}.</p>
              {draft.equityProposalApplied ? <p>Les fonds propres calculés sur le compte 2800 ont été ajoutés après confirmation.</p> : null}
              {preview ? (
                <>
                  <p>Bilan : actif {formatChfAmount(preview.balance.assetTotal)}, passif {formatChfAmount(preview.balance.fundingTotal)}.</p>
                  <p>Résultat de la période présentée : {formatChfAmount(preview.income.result)}. Du {formatSwissDate(preview.income.from)} au {formatSwissDate(preview.income.to)}.</p>
                </>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-[#334155]">
              <p>{draft.message}</p>
              {draft.equityProposal ? (
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={confirmEquity} onChange={(event) => setConfirmEquity(event.target.checked)} />
                  Utiliser les fonds propres calculés de {formatChfAmount(draft.equityProposal.amount)} sur le compte {draft.equityProposal.number} {draft.equityProposal.name}.
                </label>
              ) : null}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => setStep(2)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={() => { if (draft.ok) setStep(4); else nextFromBalances(); }}>Continuer</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 4 && draft?.ok ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Confirmation</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#475569]">{draft.coverageNote}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">{draft.journalScope}</p>
          <p className="mt-2 text-sm text-[#475569]">La confirmation enregistre la reprise une seule fois. Tant que l'exercice est ouvert, elle se corrige sur la même écriture, sans en ouvrir une deuxième.</p>
          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => setStep(3)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={() => void confirm()} disabled={busy}>{busy ? "Enregistrement…" : "Confirmer la reprise"}</ActionButton>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}

function ModeCard({ selected, title, text, onClick }: { selected: boolean; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-5 text-left ${selected ? "border-[#1A23FF] bg-[#F4F6FF]" : "border-[rgba(15,23,42,0.08)] bg-white"}`}>
      <span className="text-base font-semibold text-[#0F172A]">{title}</span>
      <span className="mt-3 block text-sm leading-relaxed text-[#475569]">{text}</span>
    </button>
  );
}

function downloadTemplate() {
  const blob = new Blob([TAKEOVER_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modele-reprise-comptable.csv";
  link.click();
  URL.revokeObjectURL(url);
}
