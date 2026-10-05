"use client";

import { useMemo, useState } from "react";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { roundChf } from "@/lib/accounting/money";
import { parseChfInput } from "@/lib/accounting/onboarding";
import { buildBalanceSheet, buildIncomeStatement } from "@/lib/accounting/reports";
import { buildTakeoverCsv, buildTakeoverWorkbook, readTakeoverFile, type WorkbookSheet } from "@/lib/accounting/takeoverImport";
import {
  TAKEOVER_CSV_HEADERS,
  TAKEOVER_CSV_HELP,
  chartTakeoverAccounts,
  dayBefore,
  planTakeover,
  type ImportCellError,
  type TakeoverAccount,
  type TakeoverJournalEntry,
  type TakeoverMode,
  type TakeoverOpenItem,
  type TakeoverSuccess,
} from "@/lib/accounting/takeover";
import { ActionButton, GlassCard } from "@/components/ui";

const fieldClass = "mt-1 w-full rounded-xl border border-[rgba(15,23,42,0.1)] bg-white px-3 py-2 text-sm text-[#0F172A]";
const choiceClass = `${fieldClass} [color-scheme:light]`;
const optionStyle = { color: "#0F172A", backgroundColor: "#ffffff" };
const COLUMN_LABELS: Record<(typeof TAKEOVER_CSV_HEADERS)[number], string> = {
  date: "Date",
  piece: "Pièce",
  libelle: "Libellé",
  compte: "Compte",
  debit: "Débit",
  credit: "Crédit",
  origine: "Référence de regroupement",
  remarque: "Remarque",
  reference: "Référence",
};

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

const MODES: Array<{ id: TakeoverMode; title: string; text: string; example: string; note?: string }> = [
  {
    id: "fresh",
    title: "Commencer sans anciennes écritures",
    text: "Vous commencez votre comptabilité dans Obillz. Si le club possède déjà de l'argent, des biens ou des dettes, vous renseignerez cette situation de départ.",
    example: "Votre club commence le 1er janvier avec 2 000 CHF en banque. Vous indiquez ce montant, puis vous enregistrez vos nouvelles opérations.",
  },
  {
    id: "full_period",
    title: "Importer mes anciennes écritures de l'exercice",
    text: "Vous voulez retrouver dans Obillz toutes les opérations de l'exercice en cours.",
    example: "Vous passez sur Obillz le 1er juillet. Vous renseignez les soldes du 1er janvier, puis vous importez les écritures de janvier à juin. Ensuite, vous continuez en juillet. Toute l'année est dans Obillz.",
  },
  {
    id: "from_date",
    title: "Commencer avec mes soldes à la date du passage",
    text: "Vous gardez les anciennes écritures dans votre ancien logiciel et continuez dans Obillz.",
    example: "Vous passez sur Obillz le 1er juillet. Vous renseignez les soldes au 30 juin, puis vous enregistrez les nouvelles opérations dès juillet. Les écritures de janvier à juin restent dans votre ancien logiciel.",
    note: "À l'étape suivante, vous pourrez aussi reprendre les totaux de charges et de produits déjà enregistrés pour obtenir un résultat annuel complet.",
  },
];

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
  const [journal, setJournal] = useState<TakeoverJournalEntry[]>([]);
  const [items, setItems] = useState<TakeoverOpenItem[]>([]);
  const [confirmEquity, setConfirmEquity] = useState(false);
  const [confirmZero, setConfirmZero] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportCellError[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [needsDelimiter, setNeedsDelimiter] = useState(false);
  const [delimiter, setDelimiter] = useState<";" | "," | null>(null);
  const [columnHeaders, setColumnHeaders] = useState<string[] | null>(null);
  const [workbookSheets, setWorkbookSheets] = useState<WorkbookSheet[]>([]);
  const [ignoredSheets, setIgnoredSheets] = useState<string[]>([]);
  const [ambiguousSheets, setAmbiguousSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headerRow, setHeaderRow] = useState(1);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Partial<Record<(typeof TAKEOVER_CSV_HEADERS)[number], string>>>({});
  const [unknownAccounts, setUnknownAccounts] = useState<string[]>([]);
  const [accountMap, setAccountMap] = useState<Record<string, string>>({});
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer | string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const catalog = [...accounts, ...customs];
  const balanceAccounts = catalog.filter((account) => account.accountType === "asset" || account.accountType === "liability" || account.accountType === "equity");
  const resultAccounts = catalog.filter((account) => account.accountType === "revenue" || account.accountType === "expense");
  const groups = groupBalances(balanceAccounts);

  const form = useMemo(() => {
    if (!mode) return null;
    return {
      mode,
      periodStart,
      periodEnd,
      takeoverDate,
      accounts: catalog,
      confirmEquityProposal: confirmEquity,
      confirmZeroOpening: confirmZero,
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
      journal: mode === "full_period" ? journal : [],
      openItems: items,
    };
  }, [amounts, balanceAccounts, catalog, confirmEquity, confirmZero, cumulatives, items, journal, legacyNumbers, mode, periodEnd, periodStart, resultAccounts, takeoverDate, withCumulatives]);

  const draft = useMemo(() => (form ? planTakeover(form) : null), [form]);
  const preview = useMemo(() => (draft?.ok ? previewReports(draft, catalog, periodStart, periodEnd, takeoverDate) : null), [catalog, draft, periodEnd, periodStart, takeoverDate]);
  const figures = draft?.ok ? presentationFigures(draft) : null;

  function payload() {
    if (!form) return { action: "onboarding" };
    return {
      action: "onboarding",
      takeoverMode: form.mode,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      takeoverDate: form.takeoverDate,
      confirmEquityProposal: form.confirmEquityProposal,
      confirmZeroOpening: form.confirmZeroOpening,
      balances: form.balances,
      customAccounts: customs.map((account) => ({ number: account.number, name: account.name, accountType: account.accountType })),
      cumulatives: form.cumulatives,
      journal: form.journal,
      openItems: form.openItems,
    };
  }

  function nextFromChoice() {
    setError(null);
    if (periodEnd < periodStart) return setError("La fin d'exercice précède le début.");
    if (takeoverDate < periodStart || takeoverDate > periodEnd) return setError("Le début des nouvelles opérations doit être compris dans l'exercice.");
    if (!mode) return setError("Choisissez comment commencer la comptabilité.");
    setStep(2);
  }

  function nextFromBalances() {
    setError(null);
    if (importErrors.length || needsDelimiter || unknownAccounts.length) {
      return setError(importMessage || "Corrigez le fichier avant de continuer.");
    }
    if (!draft) return setError("Choisissez comment commencer la comptabilité.");
    if (!draft.ok && !draft.equityProposal && !draft.message.includes("Tous les soldes sont nuls")) return setError(draft.message);
    setStep(3);
  }

  async function confirm() {
    setError(null);
    setNotice(null);
    if (importErrors.length || !draft?.ok) {
      setError(draft && !draft.ok ? draft.message : importMessage || "La reprise n'est pas prête. Rien n'a été enregistré.");
      return;
    }
    setBusy(true);
    try {
      await onDone(payload());
      setNotice("La reprise est enregistrée.");
    } catch (cause) {
      setNotice(null);
      setError(cause instanceof Error ? `${cause.message} La reprise n'a pas été enregistrée.` : "La reprise n'a pas été enregistrée.");
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

  async function ingest(nextFile: { name: string; data: ArrayBuffer | string }, options: { delimiter?: ";" | ","; columns?: Partial<Record<(typeof TAKEOVER_CSV_HEADERS)[number], string>>; accountMap?: Record<string, string>; sheet?: string; headerRow?: number; asRole?: "journal" | "balances" | "cumulatives" } = {}) {
    if (!mode) return;
    setError(null);
    setImportMessage(null);
    setImportErrors([]);
    setNeedsDelimiter(false);
    setUnknownAccounts([]);
    const result = readTakeoverFile({
      filename: nextFile.name,
      data: nextFile.data,
      mode,
      accounts: catalog,
      delimiter: options.delimiter || delimiter || undefined,
      columns: options.columns || columnMap,
      accountMap: options.accountMap || accountMap,
      sheet: options.sheet,
      headerRow: options.headerRow,
      asRole: options.asRole,
    });
    const headers = (result.headers || []).map((header) => header.trim()).filter(Boolean);
    setWorkbookSheets(result.sheets || []);
    setIgnoredSheets(result.ignoredSheets || []);
    setAmbiguousSheets(result.ambiguousSheets || []);
    setPreviewRows(result.preview || []);
    setHeaderRow(result.headerRow || options.headerRow || 1);
    if (result.previewSheet) setSelectedSheet(result.previewSheet);
    const manual = options.columns && Object.values(options.columns).some(Boolean);
    if (!manual && result.suggestedColumns) setColumnMap(result.suggestedColumns);
    setColumnHeaders(headers.length ? headers : null);
    if (!result.ok) {
      setImportMessage(result.message);
      setImportErrors(result.errors);
      setNeedsDelimiter(Boolean(result.needsDelimiter));
      setUnknownAccounts(result.unknownAccounts || []);
      if (!options.sheet) setJournal([]);
      return;
    }
    if (result.balances.length) {
      const nextAmounts = { ...amounts };
      const nextLegacy = { ...legacyNumbers };
      for (const row of result.balances) {
        nextAmounts[row.code] = String(row.amount);
        if (row.legacyNumber) nextLegacy[row.code] = row.legacyNumber;
      }
      setAmounts(nextAmounts);
      setLegacyNumbers(nextLegacy);
    }
    if (result.cumulatives.length) {
      const next = { ...cumulatives };
      for (const row of result.cumulatives) next[row.code] = String(row.amount);
      setCumulatives(next);
      setWithCumulatives(true);
    }
    const selectedRole = (result.sheets || []).find((item) => item.name === options.sheet)?.role;
    if (!options.sheet || result.journal.length || options.asRole === "journal" || selectedRole === "journal") {
      setJournal(result.journal);
    }
  }

  async function onFile(selected: File) {
    const data = selected.name.toLowerCase().endsWith(".csv") ? await selected.text() : await selected.arrayBuffer();
    const next = { name: selected.name, data };
    setFile(next);
    setDelimiter(null);
    setColumnMap({});
    setAccountMap({});
    await ingest(next, { delimiter: undefined, columns: {}, accountMap: {} });
  }

  function downloadExcel() {
    if (!mode) return;
    const bytes = buildTakeoverWorkbook({ mode, periodStart, periodEnd, takeoverDate });
    const copy = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copy).set(bytes);
    downloadBlob(new Blob([copy]), "modele-reprise-comptable.xlsx");
  }

  function downloadCsv() {
    if (!mode) return;
    const csv = buildTakeoverCsv({ mode, periodStart, periodEnd, takeoverDate });
    downloadBlob(new Blob([csv.text], { type: "text/csv;charset=utf-8" }), csv.name);
  }

  const balanceTitle = mode === "full_period" ? "Soldes au premier jour de l'exercice" : mode === "from_date" ? "Soldes juste avant la reprise" : "Biens, disponibilités, dettes et fonds propres de départ";
  const balanceDate = !mode || mode === "full_period" || (mode === "from_date" && takeoverDate <= periodStart)
    ? periodStart
    : mode === "from_date"
      ? dayBefore(takeoverDate)
      : takeoverDate;

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {["Choix et dates", "Soldes", "Contrôle", "Confirmation"].map((label, index) => (
          <li key={label} className={`rounded-full px-3 py-1 text-xs font-medium ${step === index + 1 ? "bg-[#1A23FF] text-white" : index + 1 < step ? "bg-[#EEF2FF] text-[#1A23FF]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}

      {step === 1 ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Comment commencer la comptabilité</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475569]">
            La date d'inscription du club sur Obillz ne fixe ni l'exercice ni le jour où les écritures commencent. Choisissez l'exercice, puis la façon de démarrer.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[#334155]">Début d'exercice
              <input className={fieldClass} type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </label>
            <label className="text-sm text-[#334155]">Fin d'exercice
              <input className={fieldClass} type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
            <label className="text-sm text-[#334155] sm:col-span-2">À partir de quel jour enregistrerez-vous les nouvelles opérations dans Obillz ?
              <input className={`${fieldClass} sm:max-w-xs`} type="date" value={takeoverDate} onChange={(event) => setTakeoverDate(event.target.value)} />
            </label>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {MODES.map((item) => (
              <ModeCard key={item.id} selected={mode === item.id} title={item.title} text={item.text} example={item.example} note={item.note} onClick={() => setMode(item.id)} />
            ))}
          </div>
          <div className="mt-6">
            <ActionButton type="button" variant="premiumInline" onClick={nextFromChoice}>Continuer</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 2 && mode ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">{balanceTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#475569]">
            {mode === "full_period"
              ? `Soldes au ${formatSwissDate(periodStart)}. Les écritures importées les feront évoluer ensuite. Ce ne sont pas les soldes d'aujourd'hui.`
              : mode === "from_date"
                ? `Soldes au ${formatSwissDate(balanceDate)}, immédiatement avant le ${formatSwissDate(takeoverDate)}. Ce ne sont pas de nouveaux encaissements, charges ou revenus.`
                : "Sans historique ne veut pas dire sans argent. Laissez à zéro seulement ce que le club ne possède pas et ne doit pas."}
          </p>
          <div className="mt-6 space-y-8">
            {groups.map((group) => (
              <section key={group.title}>
                <h3 className="text-sm font-semibold text-[#0F172A]">{group.title}</h3>
                <table className="mt-3 w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[rgba(15,23,42,0.08)] text-left text-xs text-[#64748B]">
                      <th className="py-2 pr-3 font-medium">Compte</th>
                      <th className="py-2 pr-3 font-medium">Nom</th>
                      <th className="py-2 pr-3 font-medium">Ancien n°</th>
                      <th className="py-2 font-medium">Solde CHF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((account) => (
                      <tr key={account.code} className="border-b border-[rgba(15,23,42,0.05)]">
                        <td className="py-3 pr-3 font-medium text-[#0F172A]">{account.number}</td>
                        <td className="py-3 pr-3 text-[#334155]">{account.name}
                          <span className="mt-1 block text-xs text-[#64748B]">{HELP[account.code] || "Compte de bilan à reprendre s'il a un solde."}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <input className={fieldClass} value={legacyNumbers[account.code] || ""} onChange={(event) => setLegacyNumbers({ ...legacyNumbers, [account.code]: event.target.value })} />
                        </td>
                        <td className="py-3">
                          <input className={fieldClass} inputMode="decimal" value={amounts[account.code] || ""} onChange={(event) => setAmounts({ ...amounts, [account.code]: event.target.value })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
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
              <div key={`${item.code}-${index}`} className="mt-3 grid gap-2 sm:grid-cols-4">
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

          {mode === "fresh" && draft && !draft.ok && draft.message.includes("Tous les soldes sont nuls") ? (
            <label className="mt-8 flex items-start gap-2 text-sm text-[#0F172A]">
              <input type="checkbox" className="mt-1" checked={confirmZero} onChange={(event) => setConfirmZero(event.target.checked)} />
              Le club n'a ni argent, ni bien, ni dette, ni fonds propres. Je confirme un départ à zéro.
            </label>
          ) : null}

          {mode === "from_date" ? (
            <section className="mt-8 rounded-2xl border border-[rgba(15,23,42,0.08)] p-4">
              <h3 className="text-sm font-semibold text-[#0F172A]">Cumuls antérieurs, facultatifs</h3>
              <p className="mt-1 text-sm text-[#475569]">Ces totaux de charges et de produits, du {formatSwissDate(periodStart)} à la veille du {formatSwissDate(takeoverDate)}, servent seulement à obtenir un résultat annuel. Ils ne remplacent pas les soldes de bilan et ne doivent pas reprendre les mêmes opérations une seconde fois.</p>
              <label className="mt-3 flex items-start gap-2 text-sm text-[#0F172A]">
                <input type="checkbox" className="mt-1" checked={withCumulatives} onChange={(event) => setWithCumulatives(event.target.checked)} />
                Reprendre ces cumuls.
              </label>
              {withCumulatives ? (
                <table className="mt-3 w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left text-xs text-[#64748B]">
                      <th className="py-2 pr-3">Compte</th>
                      <th className="py-2 pr-3">Nom</th>
                      <th className="py-2">Cumul CHF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultAccounts.map((account) => (
                      <tr key={account.code} className="border-b border-[rgba(15,23,42,0.05)]">
                        <td className="py-2 pr-3">{account.number}</td>
                        <td className="py-2 pr-3">{account.name}</td>
                        <td className="py-2"><input className={fieldClass} inputMode="decimal" value={cumulatives[account.code] || ""} onChange={(event) => setCumulatives({ ...cumulatives, [account.code]: event.target.value })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-sm text-[#475569]">Sans ces cumuls, le compte de résultat couvrira seulement la période depuis le {formatSwissDate(takeoverDate)}.</p>
              )}
            </section>
          ) : null}

          {mode === "full_period" && takeoverDate > periodStart ? (
            <section className="mt-8">
              <h3 className="text-sm font-semibold text-[#0F172A]">Écritures du {formatSwissDate(periodStart)} au {formatSwissDate(dayBefore(takeoverDate))} inclus</h3>
              <p className="mt-1 text-sm text-[#475569]">Les écritures historiques vont du {formatSwissDate(periodStart)} au {formatSwissDate(dayBefore(takeoverDate))} inclus. Les nouvelles opérations commencent le {formatSwissDate(takeoverDate)}.</p>
              <details className="mt-2 text-sm text-[#475569]">
                <summary className="cursor-pointer font-medium text-[#1A23FF]">Comment remplir le fichier</summary>
                <p className="mt-2 leading-relaxed">{TAKEOVER_CSV_HELP}</p>
              </details>
              <div className="mt-3 flex flex-wrap gap-4">
                <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={downloadExcel}>Télécharger le modèle Excel</button>
                <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={downloadCsv}>Télécharger le modèle CSV</button>
              </div>
              <FileDrop onFile={(selected) => void onFile(selected)} />
              <ImportWorkspace
                file={file}
                sheets={workbookSheets}
                ignoredSheets={ignoredSheets}
                ambiguousSheets={ambiguousSheets}
                selectedSheet={selectedSheet}
                headerRow={headerRow}
                columnHeaders={columnHeaders}
                columnMap={columnMap}
                previewRows={previewRows}
                needsDelimiter={needsDelimiter}
                unknownAccounts={unknownAccounts}
                accountMap={accountMap}
                catalog={catalog}
                message={importMessage}
                errors={importErrors}
                journal={journal}
                onDelimiter={(value) => { setDelimiter(value); if (file) void ingest(file, { delimiter: value, sheet: selectedSheet || undefined, headerRow }); }}
                onSheet={(name) => {
                  setSelectedSheet(name);
                  const role = workbookSheets.find((item) => item.name === name)?.role;
                  if (!file || role === "ambiguous") return;
                  void ingest(file, { sheet: name, headerRow, asRole: role === "journal" || role === "balances" || role === "cumulatives" ? role : undefined });
                }}
                onConfirmAmbiguous={(name) => { setSelectedSheet(name); if (file) void ingest(file, { sheet: name, headerRow, asRole: "journal" }); }}
                onHeaderRow={(row) => { setHeaderRow(row); if (file) void ingest(file, { sheet: selectedSheet || undefined, headerRow: row, asRole: workbookSheets.find((item) => item.name === selectedSheet)?.role === "journal" ? "journal" : undefined }); }}
                onColumn={(field, value) => {
                  const next = { ...columnMap, [field]: value };
                  setColumnMap(next);
                  if (file) void ingest(file, { columns: next, sheet: selectedSheet || undefined, headerRow });
                }}
                onAccount={(number, value) => {
                  const next = { ...accountMap, [number]: value };
                  setAccountMap(next);
                  if (file && value) void ingest(file, { accountMap: next, columns: columnMap, sheet: selectedSheet || undefined, headerRow });
                }}
              />
            </section>
          ) : null}
          {mode === "full_period" && takeoverDate === periodStart ? (
            <p className="mt-6 text-sm text-[#475569]">La reprise tombe le premier jour. Le bilan de départ suffit. Les opérations de l'année précédente ne s'importent pas.</p>
          ) : null}
          {mode !== "full_period" ? (
            <div className="mt-6 flex flex-wrap gap-4">
              <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={downloadExcel}>Télécharger le modèle Excel</button>
              <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={downloadCsv}>Télécharger le modèle CSV</button>
            </div>
          ) : null}
          {mode !== "full_period" || takeoverDate === periodStart ? (
            <div className="mt-4">
              <FileDrop onFile={(selected) => void onFile(selected)} />
              <ImportIssues message={importMessage} errors={importErrors} />
            </div>
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
          <p className="mt-2 text-sm text-[#64748B]">Aperçu calculé dans le formulaire. Rien n'est encore enregistré.</p>
          {draft.ok && figures ? (
            <PreviewSummary
              mode={mode}
              periodStart={periodStart}
              periodEnd={periodEnd}
              takeoverDate={takeoverDate}
              openingDate={draft.openingDate}
              balances={form?.balances || []}
              accounts={catalog}
              journalCount={draft.journal.length}
              lineCount={draft.journal.reduce((sum, entry) => sum + entry.lines.length, 0)}
              cumulatives={form?.cumulatives || []}
              debit={figures.debit}
              credit={figures.credit}
              gap={figures.gap}
              coverage={draft.coverageNote}
              incomeFrom={preview?.income.from || takeoverDate}
              incomeTo={preview?.income.to || periodEnd}
              result={preview?.income.result || 0}
            />
          ) : (
            <div className="mt-4 space-y-3 text-sm text-[#334155]">
              <p>{draft.ok ? "" : draft.message}</p>
              {!draft.ok && draft.equityProposal ? (
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={confirmEquity} onChange={(event) => setConfirmEquity(event.target.checked)} />
                  Utiliser les fonds propres calculés de {formatChfAmount(draft.equityProposal.amount)} sur le compte {draft.equityProposal.number} {draft.equityProposal.name}.
                </label>
              ) : null}
              {!draft.ok && draft.message.includes("Tous les soldes sont nuls") ? (
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={confirmZero} onChange={(event) => setConfirmZero(event.target.checked)} />
                  Je confirme que tous les soldes de départ sont nuls.
                </label>
              ) : null}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => setStep(2)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" disabled={!draft.ok} onClick={() => { if (draft.ok) setStep(4); }}>Continuer</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 4 && draft?.ok && figures && form ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Confirmation</h2>
          <p className="mt-2 text-sm text-[#64748B]">Les informations ci-dessous viennent du formulaire en cours. Un second clic ne crée pas une deuxième reprise.</p>
          <PreviewSummary
            mode={form.mode}
            periodStart={form.periodStart}
            periodEnd={form.periodEnd}
            takeoverDate={form.takeoverDate}
            openingDate={draft.openingDate}
            balances={form.balances}
            accounts={catalog}
            journalCount={draft.journal.length}
            lineCount={draft.journal.reduce((sum, entry) => sum + entry.lines.length, 0)}
            cumulatives={form.cumulatives}
            debit={figures.debit}
            credit={figures.credit}
            gap={figures.gap}
            coverage={draft.coverageNote}
            incomeFrom={preview?.income.from || form.takeoverDate}
            incomeTo={preview?.income.to || form.periodEnd}
            result={preview?.income.result || 0}
          />
          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => setStep(3)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={() => void confirm()} disabled={busy || !draft.ok}>{busy ? "Enregistrement…" : "Confirmer la reprise"}</ActionButton>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}

function PreviewSummary(props: {
  mode: TakeoverMode | null;
  periodStart: string;
  periodEnd: string;
  takeoverDate: string;
  openingDate: string;
  balances: Array<{ code: string; amount: number }>;
  accounts: TakeoverAccount[];
  journalCount: number;
  lineCount: number;
  cumulatives: Array<{ code: string; amount: number }>;
  debit: number;
  credit: number;
  gap: number;
  coverage: string;
  incomeFrom: string;
  incomeTo: string;
  result: number;
}) {
  const names = new Map(props.accounts.map((account) => [account.code, `${account.number} ${account.name}`]));
  return (
    <div className="mt-4 space-y-2 text-sm text-[#334155]">
      <p>Méthode : {MODES.find((item) => item.id === props.mode)?.title}. Exercice du {formatSwissDate(props.periodStart)} au {formatSwissDate(props.periodEnd)}.</p>
      <p>Début des nouvelles opérations dans Obillz : {formatSwissDate(props.takeoverDate)}. Date des soldes : {formatSwissDate(props.openingDate)}.</p>
      {props.balances.length ? props.balances.map((row) => (
        <p key={row.code}>{names.get(row.code) || row.code} : {formatChfAmount(row.amount)}</p>
      )) : <p>Aucun solde de bilan saisi.</p>}
      <p>{props.journalCount} écriture{props.journalCount > 1 ? "s" : ""} importée{props.journalCount > 1 ? "s" : ""}, {props.lineCount} ligne{props.lineCount > 1 ? "s" : ""}.</p>
      {props.cumulatives.length ? props.cumulatives.map((row) => (
        <p key={row.code}>Cumul {names.get(row.code) || row.code} : {formatChfAmount(row.amount)}</p>
      )) : <p>Aucun cumul antérieur.</p>}
      <p>Total débit {formatChfAmount(props.debit)}, total crédit {formatChfAmount(props.credit)}, écart {formatChfAmount(props.gap)}.</p>
      <p>Résultat présenté : {formatChfAmount(props.result)}, du {formatSwissDate(props.incomeFrom)} au {formatSwissDate(props.incomeTo)}.</p>
      <p>{props.coverage}</p>
    </div>
  );
}

function JournalPreview({ entries }: { entries: TakeoverJournalEntry[] }) {
  return (
    <table className="mt-4 w-full text-sm">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b text-left text-xs text-[#64748B]">
          <th className="py-2 pr-3">Origine</th>
          <th className="py-2 pr-3">Date</th>
          <th className="py-2 pr-3">Libellé</th>
          <th className="py-2 pr-3">Lignes</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.origin} className="border-b border-[rgba(15,23,42,0.05)]">
            <td className="py-2 pr-3">{entry.origin}</td>
            <td className="py-2 pr-3">{formatSwissDate(entry.date)}</td>
            <td className="py-2 pr-3">{entry.label || entry.piece}</td>
            <td className="py-2 pr-3">{entry.lines.length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ImportIssues({ message, errors }: { message: string | null; errors: ImportCellError[] }) {
  if (!message && !errors.length) return null;
  return (
    <div className="mt-3 text-sm text-rose-700">
      {message ? <p>{message}</p> : null}
      <ul className="mt-2 list-disc pl-5">
        {errors.map((issue, index) => (
          <li key={`${issue.sheet}-${issue.row}-${issue.column}-${index}`}>
            Feuille {issue.sheet}, ligne {issue.row || "—"}, colonne {issue.column} : {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FileDrop({ onFile }: { onFile: (file: File) => void }) {
  return (
    <label
      className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-[rgba(26,35,255,0.35)] bg-[#F8F9FF] px-4 py-8 text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) onFile(dropped);
      }}
    >
      <span className="text-sm font-medium text-[#0F172A]">Déposez un fichier Excel ou CSV</span>
      <span className="mt-1 text-xs text-[#64748B]">.xlsx ou .csv. L'aperçu n'enregistre rien.</span>
      <input className="sr-only" type="file" accept=".xlsx,.xlsm,.csv,text/csv" onChange={(event) => {
        const selected = event.target.files?.[0];
        if (selected) onFile(selected);
      }} />
    </label>
  );
}

function ModeCard({ selected, title, text, example, note, onClick }: { selected: boolean; title: string; text: string; example: string; note?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-full min-w-0 flex-col rounded-2xl border p-5 text-left ${selected ? "border-[#1A23FF] bg-[#F4F6FF]" : "border-[rgba(15,23,42,0.08)] bg-white"}`}>
      <span className="text-base font-semibold leading-snug text-[#0F172A]">{title}</span>
      <span className="mt-3 block text-sm leading-relaxed text-[#475569]">{text}</span>
      <span className={`mt-4 block rounded-xl px-3 py-3 ${selected ? "bg-white" : "bg-[#F8FAFC]"}`}>
        <span className="block text-xs font-semibold text-[#1A23FF]">Exemple</span>
        <span className="mt-1 block text-sm leading-relaxed text-[#334155]">{example}</span>
      </span>
      {note ? <span className="mt-3 block text-sm leading-relaxed text-[#475569]">{note}</span> : null}
    </button>
  );
}

function ImportWorkspace(props: {
  file: { name: string; data: ArrayBuffer | string } | null;
  sheets: WorkbookSheet[];
  ignoredSheets: string[];
  ambiguousSheets: string[];
  selectedSheet: string;
  headerRow: number;
  columnHeaders: string[] | null;
  columnMap: Partial<Record<(typeof TAKEOVER_CSV_HEADERS)[number], string>>;
  previewRows: string[][];
  needsDelimiter: boolean;
  unknownAccounts: string[];
  accountMap: Record<string, string>;
  catalog: TakeoverAccount[];
  message: string | null;
  errors: ImportCellError[];
  journal: TakeoverJournalEntry[];
  onDelimiter: (value: ";" | ",") => void;
  onSheet: (name: string) => void;
  onConfirmAmbiguous: (name: string) => void;
  onHeaderRow: (row: number) => void;
  onColumn: (field: (typeof TAKEOVER_CSV_HEADERS)[number], value: string) => void;
  onAccount: (number: string, value: string) => void;
}) {
  if (!props.file) return null;
  const importable = props.sheets.filter((item) => item.role !== "ignored");
  return (
    <div>
      <ImportIssues message={props.message} errors={props.errors} />
      {props.ignoredSheets.length ? <p className="mt-3 text-sm text-[#475569]">Feuille ignorée : {props.ignoredSheets.join(", ")}. Ce texte explicatif n'est pas importé.</p> : null}
      {importable.length ? (
        <label className="mt-4 block text-xs text-[#64748B]">Feuille
          <select className={choiceClass} style={{ colorScheme: "light", color: "#0F172A", backgroundColor: "#ffffff" }} value={props.selectedSheet} onChange={(event) => props.onSheet(event.target.value)}>
            {importable.map((item) => (
              <option key={item.name} value={item.name} style={optionStyle}>{item.name}{item.role === "ambiguous" ? " — à confirmer" : ""}</option>
            ))}
          </select>
        </label>
      ) : null}
      {props.ambiguousSheets.includes(props.selectedSheet) ? (
        <button type="button" className="mt-3 text-sm font-semibold text-[#1A23FF]" onClick={() => props.onConfirmAmbiguous(props.selectedSheet)}>Importer cette feuille comme écritures</button>
      ) : null}
      {props.file.name.toLowerCase().endsWith(".csv") || importable.length ? (
        <label className="mt-4 block text-xs text-[#64748B]">Ligne des en-têtes
          <select className={choiceClass} style={{ colorScheme: "light", color: "#0F172A", backgroundColor: "#ffffff" }} value={String(props.headerRow)} onChange={(event) => props.onHeaderRow(Number(event.target.value))}>
            {Array.from({ length: 15 }, (_, index) => (
              <option key={index + 1} value={String(index + 1)} style={optionStyle}>Ligne {index + 1}</option>
            ))}
          </select>
        </label>
      ) : null}
      {props.needsDelimiter ? (
        <div className="mt-3 flex gap-3">
          <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={() => props.onDelimiter(";")}>Point-virgule</button>
          <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={() => props.onDelimiter(",")}>Virgule</button>
        </div>
      ) : null}
      {props.columnHeaders?.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TAKEOVER_CSV_HEADERS.map((field) => (
            <label key={field} className="text-xs text-[#334155]">{COLUMN_LABELS[field]}
              <select className={choiceClass} style={{ colorScheme: "light", color: "#0F172A", backgroundColor: "#ffffff" }} value={props.columnMap[field] || ""} onChange={(event) => props.onColumn(field, event.target.value)}>
                <option value="" style={optionStyle}>Choisir une colonne</option>
                {props.columnHeaders?.filter((header) => header.trim()).map((header) => (
                  <option key={header} value={header} style={optionStyle}>{header}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      {props.unknownAccounts.length ? (
        <div className="mt-4 space-y-2">
          {props.unknownAccounts.map((number) => (
            <label key={number} className="block text-sm text-[#334155]">Ancien compte {number}
              <select className={choiceClass} style={{ colorScheme: "light", color: "#0F172A", backgroundColor: "#ffffff" }} value={props.accountMap[number] || ""} onChange={(event) => props.onAccount(number, event.target.value)}>
                <option value="" style={optionStyle}>Associer à un compte Obillz</option>
                {props.catalog.map((account) => <option key={account.code} value={account.number} style={optionStyle}>{account.number} {account.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      {props.previewRows.length ? (
        <div className="mt-4 overflow-x-auto">
          <p className="text-xs font-medium text-[#64748B]">Aperçu des premières lignes</p>
          <table className="mt-2 w-full text-sm text-[#0F172A]">
            <tbody>
              {props.previewRows.map((row, index) => (
                <tr key={index} className="border-b border-[rgba(15,23,42,0.05)]">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="py-1 pr-3">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {props.journal.length ? <JournalPreview entries={props.journal} /> : null}
    </div>
  );
}

function groupBalances(accounts: TakeoverAccount[]) {
  const used = new Set<string>();
  const take = (title: string, match: (account: TakeoverAccount) => boolean) => {
    const rows = accounts.filter((account) => !used.has(account.code) && match(account));
    rows.forEach((account) => used.add(account.code));
    return { title, rows };
  };
  return [
    take("Disponibilités", (account) => account.code === "cash" || account.code === "bank" || account.code === "stripe" || account.code.startsWith("bank_")),
    take("Créances, stocks et autres actifs", (account) => account.accountType === "asset"),
    take("Dettes", (account) => account.accountType === "liability"),
    take("Fonds propres", (account) => account.accountType === "equity"),
  ].filter((group) => group.rows.length);
}

function presentationFigures(draft: TakeoverSuccess) {
  const lines = [
    ...draft.openingLines,
    ...draft.journal.flatMap((entry) => entry.lines),
    ...(draft.rollup?.lines ?? []),
  ];
  const debit = roundChf(lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = roundChf(lines.reduce((sum, line) => sum + line.credit, 0));
  return { debit, credit, gap: roundChf(debit - credit) };
}

function previewReports(draft: TakeoverSuccess, catalog: TakeoverAccount[], periodStart: string, periodEnd: string, takeoverDate: string) {
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
    entries.push({ id, entry_number: index + 2, entry_date: entry.date, description: entry.label, status: "validated", reference: entry.reference || entry.piece, source_type: "import", event_type: "import" });
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
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
