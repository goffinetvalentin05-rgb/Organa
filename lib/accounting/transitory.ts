import { periodCoveringDate } from "./closePeriod";
import { roundChf } from "./money";
import { planReceipt } from "./receipts";

export const CLOSED_PAYMENT_DATE_MESSAGE =
  "Cette date de paiement appartient à un exercice clôturé. Elle n'a pas été modifiée et l'exercice n'a pas été rouvert.";

export const CLOSED_ALLOCATION_MESSAGE =
  "Cet exercice est clôturé. Il ne peut plus recevoir de nouvelle affectation.";

export const VAT_TRANSITORY_MESSAGE =
  "Cette facture comporte de la TVA. L'option Transitoire ne répartit pas la TVA entre les exercices. Enregistrez un encaissement normal, qui conserve le traitement actuel.";

export const BRIDGE_CLOSED_CORRECTION_MESSAGE =
  "Cette correction touche une écriture d'un exercice clôturé. Aucune partie de l'encaissement transitoire n'a été modifiée.";

export const BRIDGE_EDIT_MESSAGE =
  "Cette écriture appartient à un encaissement transitoire. Retirez l'encaissement entier pendant que les exercices concernés sont ouverts.";

export const EXISTING_ACCRUAL_MESSAGE =
  "Une régularisation existe déjà pour cette facture. Ouvrez Transitoire pour solder la créance, sans comptabiliser le produit une seconde fois.";

export type BridgePeriod = {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
  status: string;
};

export type BridgeAccount = {
  id: string;
  number: string;
  name: string;
  systemCode: string | null;
};

export type BridgeLine = { accountId: string; debit: number; credit: number };

export type BridgeEffect = {
  role: "accrual" | "settlement" | "deferral" | "release";
  periodId: string;
  date: string;
  eventType: "accrual_income" | "payment_received" | "deferred_release";
  lines: BridgeLine[];
  recognizesRevenue: boolean;
  movesTreasury: boolean;
};

export type BridgePreview = { periodLabel: string; date: string; text: string };

export type ExistingAccrual = {
  entryId: string;
  periodId: string;
  periodLabel: string;
  periodStatus: string;
  amount: number;
  openAmount: number;
};

export type TransitoryPlan =
  | {
      ok: true;
      kind: "prior" | "future" | "settle";
      paymentDate: string;
      paymentPeriodId: string;
      productPeriodId: string | null;
      recognitionDate: string | null;
      clearingAccountId: string;
      clearingCode: "debtors" | "prepaid" | "accrued";
      accrualAmount: number;
      settlementAmount: number;
      effects: BridgeEffect[];
      preview: BridgePreview[];
      explanation: string;
      info: string | null;
    }
  | { ok: false; message: string; paymentDate: string };

/** La case n'est jamais cochée par une date de facture. */
export function transitoryEngaged(checked: boolean): boolean {
  return checked === true;
}

export function openAllocationPeriods<T extends { status: string }>(periods: T[]): T[] {
  return periods.filter((period) => period.status === "open");
}

export function transitoryVatBlock(totalHt: number, totalTva: number, totalTtc: number): string | null {
  const vat = roundChf(totalTva);
  const ht = roundChf(totalHt);
  const ttc = roundChf(totalTtc);
  if (vat > 0 || (ht > 0 && ttc > ht)) return VAT_TRANSITORY_MESSAGE;
  return null;
}

export function straddlingSuggestion(input: {
  invoiceDate: string | null;
  paymentDate: string;
  periods: BridgePeriod[];
}): string | null {
  if (!input.invoiceDate) return null;
  const invoicePeriod = periodCoveringDate(input.periods, input.invoiceDate, false);
  const paymentPeriod = periodCoveringDate(input.periods, input.paymentDate, false);
  if (!invoicePeriod || !paymentPeriod || invoicePeriod.id === paymentPeriod.id) return null;
  return "La date de la facture et la date du paiement ne sont pas dans le même exercice. Cela ne choisit pas l'exercice du produit : ouvrez Transitoire seulement si la prestation concerne réellement un autre exercice.";
}

/** Fin de l'exercice précédent, ou début de l'exercice futur. La date reste modifiable. */
export function proposedRecognitionDate(
  period: { startsOn: string; endsOn: string },
  paymentDate: string,
): string {
  if (paymentDate < period.startsOn) return period.startsOn;
  if (paymentDate > period.endsOn) return period.endsOn;
  return paymentDate;
}

export function clearingSystemCode(input: {
  mode: "prior" | "future";
  documentType: string;
  documentStatus: string;
}): "debtors" | "prepaid" | "accrued" {
  if (input.mode === "future") return "accrued";
  const draft = input.documentStatus === "brouillon" || input.documentStatus === "draft";
  if (input.documentType === "invoice" && !draft) return "debtors";
  return "prepaid";
}

export function bridgeOutcome(input: {
  existingKey: string | null;
  key: string;
  steps: string[];
  failAt: string | null;
}): { created: boolean; already: boolean; posted: string[] } {
  if (!input.key.trim()) return { created: false, already: false, posted: [] };
  if (input.existingKey === input.key) return { created: false, already: true, posted: [...input.steps] };
  if (input.failAt && input.steps.includes(input.failAt)) return { created: false, already: false, posted: [] };
  return { created: true, already: false, posted: [...input.steps] };
}

export function planBridgeCorrection(
  halves: Array<{ id: string; periodStatus: string; status: string }>,
): { ok: true; voidIds: string[] } | { ok: false; message: string } {
  const active = halves.filter((half) => half.status !== "voided");
  if (active.length === 0) return { ok: false, message: "Cette écriture a déjà été retirée du journal." };
  if (active.some((half) => half.periodStatus !== "open")) {
    return { ok: false, message: BRIDGE_CLOSED_CORRECTION_MESSAGE };
  }
  return { ok: true, voidIds: active.map((half) => half.id) };
}

const CLEARING_MISSING: Record<"debtors" | "prepaid" | "accrued", string> = {
  debtors: "Le compte Débiteurs est introuvable dans le plan",
  prepaid: "Le compte d'actifs transitoires est introuvable dans le plan",
  accrued: "Le compte de passifs transitoires est introuvable dans le plan",
};

function dateIn(period: { startsOn: string; endsOn: string }, date: string): boolean {
  return date >= period.startsOn && date <= period.endsOn;
}

function previewLine(
  period: BridgePeriod,
  date: string,
  debit: BridgeAccount,
  credit: BridgeAccount,
  amount: number,
): BridgePreview {
  return {
    periodLabel: period.label,
    date,
    text: `Débit ${debit.number} ${debit.name}, crédit ${credit.number} ${credit.name}, CHF ${amount.toFixed(2)}`,
  };
}

export function planTransitory(input: {
  invoiceTotal: number;
  alreadyReceived: number;
  paymentAmount: number;
  paymentDate: string;
  documentType: string;
  documentStatus: string;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  periods: BridgePeriod[];
  productPeriodId: string | null;
  recognitionDate: string | null;
  treasuryAccountId: string;
  revenueAccountId: string;
  accounts: BridgeAccount[];
  regularized: number;
  settled: number;
  released: number;
  existingAccrual?: ExistingAccrual | null;
  preferredClearingId?: string | null;
}): TransitoryPlan {
  const paymentDate = input.paymentDate;
  const fail = (message: string): TransitoryPlan => ({ ok: false, message, paymentDate });
  const vat = transitoryVatBlock(input.totalHt, input.totalTva, input.totalTtc);
  if (vat) return fail(vat);

  const cash = planReceipt(input.invoiceTotal, input.alreadyReceived, input.paymentAmount);
  if (!cash.ok) {
    return fail(cash.reason === "settled"
      ? "Cette facture est déjà soldée"
      : "Montant supérieur au reste à encaisser");
  }

  const paymentPeriod = periodCoveringDate(input.periods, paymentDate, false);
  if (!paymentPeriod) return fail("Aucun exercice ouvert à cette date");
  if (paymentPeriod.status !== "open") return fail(CLOSED_PAYMENT_DATE_MESSAGE);

  const treasury = input.accounts.find((account) => account.id === input.treasuryAccountId);
  const revenue = input.accounts.find((account) => account.id === input.revenueAccountId);
  if (!treasury) return fail("Choisissez un compte de trésorerie : banque, poste ou caisse");
  if (!revenue) return fail("Compte de produit introuvable pour cette catégorie");

  const regularized = roundChf(input.regularized);
  const settled = roundChf(input.settled);
  const openReceivable = roundChf(regularized - settled);
  if (openReceivable < 0) return fail("Le solde de la créance est incohérent");

  const settleOnly = openReceivable > 0 && cash.amount <= openReceivable;
  if (settleOnly) {
    const code = clearingSystemCode({
      mode: "prior",
      documentType: input.documentType,
      documentStatus: input.documentStatus,
    });
    const clearing = input.accounts.find((account) => account.id === input.preferredClearingId)
      ?? input.accounts.find((account) => account.systemCode === code);
    if (!clearing) return fail(CLEARING_MISSING[code]);
    const effect: BridgeEffect = {
      role: "settlement",
      periodId: paymentPeriod.id,
      date: paymentDate,
      eventType: "payment_received",
      lines: [
        { accountId: treasury.id, debit: cash.amount, credit: 0 },
        { accountId: clearing.id, debit: 0, credit: cash.amount },
      ],
      recognizesRevenue: false,
      movesTreasury: true,
    };
    const existing = input.existingAccrual;
    const info = existing
      ? `Régularisation existante ${existing.entryId} dans l'exercice ${existing.periodLabel}${existing.periodStatus === "closed" ? " (clôturé)" : ""}. Ce paiement solde la créance en ${paymentPeriod.label} et ne modifie pas cet exercice.`
      : `Une créance de CHF ${openReceivable.toFixed(2)} est déjà régularisée. Ce paiement la solde sans comptabiliser le produit une seconde fois.`;
    return {
      ok: true,
      kind: "settle",
      paymentDate,
      paymentPeriodId: paymentPeriod.id,
      productPeriodId: existing?.periodId ?? null,
      recognitionDate: null,
      clearingAccountId: clearing.id,
      clearingCode: code,
      accrualAmount: 0,
      settlementAmount: cash.amount,
      effects: [effect],
      preview: [previewLine(paymentPeriod, paymentDate, treasury, clearing, cash.amount)],
      explanation: "La créance déjà régularisée est soldée à la date réelle du paiement. Le produit n'est pas comptabilisé une seconde fois.",
      info,
    };
  }

  const product = input.periods.find((period) => period.id === input.productPeriodId);
  if (!product) return fail("Choisissez l'exercice du produit");
  if (product.id === paymentPeriod.id) {
    return fail("Le produit et le paiement sont dans le même exercice. Laissez le parcours normal.");
  }

  let mode: "prior" | "future";
  if (product.startsOn > paymentPeriod.endsOn) mode = "future";
  else if (product.endsOn < paymentPeriod.startsOn) mode = "prior";
  else return fail("Les exercices se chevauchent");

  if (mode === "future") {
    if (product.status !== "open") return fail(CLOSED_ALLOCATION_MESSAGE);
    if (!input.recognitionDate || !dateIn(product, input.recognitionDate)) {
      return fail("La date de rattachement doit être comprise dans l'exercice du produit.");
    }
    if (roundChf(input.released + cash.amount) > roundChf(input.invoiceTotal)) {
      return fail("Ce produit a déjà été rattaché pour un montant qui couvre la facture.");
    }
    const clearing = input.accounts.find((account) => account.systemCode === "accrued");
    if (!clearing) return fail(CLEARING_MISSING.accrued);
    const recognitionDate = input.recognitionDate;
    const deferral: BridgeEffect = {
      role: "deferral",
      periodId: paymentPeriod.id,
      date: paymentDate,
      eventType: "payment_received",
      lines: [
        { accountId: treasury.id, debit: cash.amount, credit: 0 },
        { accountId: clearing.id, debit: 0, credit: cash.amount },
      ],
      recognizesRevenue: false,
      movesTreasury: true,
    };
    const release: BridgeEffect = {
      role: "release",
      periodId: product.id,
      date: recognitionDate,
      eventType: "deferred_release",
      lines: [
        { accountId: clearing.id, debit: cash.amount, credit: 0 },
        { accountId: revenue.id, debit: 0, credit: cash.amount },
      ],
      recognizesRevenue: true,
      movesTreasury: false,
    };
    return {
      ok: true,
      kind: "future",
      paymentDate,
      paymentPeriodId: paymentPeriod.id,
      productPeriodId: product.id,
      recognitionDate,
      clearingAccountId: clearing.id,
      clearingCode: "accrued",
      accrualAmount: 0,
      settlementAmount: cash.amount,
      effects: [deferral, release],
      preview: [
        previewLine(paymentPeriod, paymentDate, treasury, clearing, cash.amount),
        previewLine(product, recognitionDate, clearing, revenue, cash.amount),
      ],
      explanation: "La trésorerie augmente à la date réelle du paiement. Le produit est rattaché seulement à la date confirmée de l'exercice futur.",
      info: null,
    };
  }

  const newAccrual = roundChf(Math.max(0, cash.amount - openReceivable));
  if (roundChf(regularized + newAccrual) > roundChf(input.invoiceTotal)) {
    return fail("Cette régularisation dépasse le montant de la facture");
  }
  if (roundChf(openReceivable + newAccrual) < cash.amount) {
    return fail("Le règlement dépasse le solde de la créance");
  }
  if (newAccrual > 0 && product.status !== "open") {
    if (openReceivable > 0) {
      return fail(`L'exercice du produit est clôturé. Seul le solde déjà régularisé de CHF ${openReceivable.toFixed(2)} peut encore être encaissé, sans nouvelle régularisation.`);
    }
    return fail(CLOSED_ALLOCATION_MESSAGE);
  }
  if (newAccrual > 0 && (!input.recognitionDate || !dateIn(product, input.recognitionDate))) {
    return fail("La date de rattachement doit être comprise dans l'exercice du produit.");
  }

  const code = clearingSystemCode({
    mode: "prior",
    documentType: input.documentType,
    documentStatus: input.documentStatus,
  });
  const clearing = input.accounts.find((account) => account.id === input.preferredClearingId && account.systemCode === code)
    ?? input.accounts.find((account) => account.systemCode === code);
  if (!clearing) return fail(CLEARING_MISSING[code]);

  const effects: BridgeEffect[] = [];
  const preview: BridgePreview[] = [];
  if (newAccrual > 0 && input.recognitionDate) {
    effects.push({
      role: "accrual",
      periodId: product.id,
      date: input.recognitionDate,
      eventType: "accrual_income",
      lines: [
        { accountId: clearing.id, debit: newAccrual, credit: 0 },
        { accountId: revenue.id, debit: 0, credit: newAccrual },
      ],
      recognizesRevenue: true,
      movesTreasury: false,
    });
    preview.push(previewLine(product, input.recognitionDate, clearing, revenue, newAccrual));
  }
  effects.push({
    role: "settlement",
    periodId: paymentPeriod.id,
    date: paymentDate,
    eventType: "payment_received",
    lines: [
      { accountId: treasury.id, debit: cash.amount, credit: 0 },
      { accountId: clearing.id, debit: 0, credit: cash.amount },
    ],
    recognizesRevenue: false,
    movesTreasury: true,
  });
  preview.push(previewLine(paymentPeriod, paymentDate, treasury, clearing, cash.amount));

  return {
    ok: true,
    kind: "prior",
    paymentDate,
    paymentPeriodId: paymentPeriod.id,
    productPeriodId: product.id,
    recognitionDate: input.recognitionDate,
    clearingAccountId: clearing.id,
    clearingCode: code,
    accrualAmount: newAccrual,
    settlementAmount: cash.amount,
    effects,
    preview,
    explanation: "Le produit est rattaché à l'exercice de la prestation. La trésorerie augmente seulement à la date réelle du paiement.",
    info: openReceivable > 0
      ? "La régularisation existante est réutilisée. Seul le complément encore ouvert est ajouté."
      : null,
  };
}
