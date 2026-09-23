"use client";

import { useMemo, useState } from "react";
import { ACCOUNT_CLASS_LABELS, DEFAULT_MAPPINGS, RECOMMENDED_CHART } from "@/lib/accounting/chart";
import { formatChfAmount, formatSwissDate, zurichToday } from "@/lib/accounting/format";
import {
  HISTORY_IMPORT_FORMATS,
  OTHER_OPENING_PRESETS,
  dateInPeriod,
  nextAccountingPeriod,
  parseChfInput,
  suggestBankNumber,
  type StartMode,
} from "@/lib/accounting/onboarding";
import { ActionButton, GlassCard } from "@/components/ui";
import { cn } from "@/components/ui/cn";

const STEPS = [
  "Exercice",
  "Démarrage",
  "Situation",
  "Plan",
  "Mappings",
  "Confirmation",
] as const;

const MAPPING_LABELS: Record<string, string> = {
  membership: "Cotisations",
  sponsoring: "Sponsoring",
  donation: "Dons",
  event_income: "Manifestations",
  shop: "Boutique",
  supporters: "Cartes supporters",
  support_sale: "Ventes de soutien",
  grant: "Subventions",
  buvette: "Buvette",
  other_income: "Autres produits",
  sports_equipment: "Matériel sportif",
  equipment: "Équipements",
  referees: "Arbitrage",
  personnel: "Personnel",
  social_charges: "Charges sociales",
  rent: "Locations",
  travel: "Déplacements",
  admin: "Frais administratifs",
  communication: "Communication",
  events_expense: "Charges de manifestations",
  bank_fees: "Frais bancaires",
  other_expense: "Autres charges",
};

type BankDraft = { name: string; number: string; amount: string };

const fieldClass = "mt-1 w-full rounded-xl border border-[rgba(15,23,42,0.1)] px-3 py-2 text-sm";

export default function AccountingOnboarding({
  usesStripe,
  onDone,
}: {
  usesStripe: boolean;
  onDone: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const today = zurichToday();
  const year = today.slice(0, 4);
  const [step, setStep] = useState(1);
  const [periodStart, setPeriodStart] = useState(`${year}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(`${year}-12-31`);
  const [mode, setMode] = useState<StartMode | null>(null);
  const [banks, setBanks] = useState<BankDraft[]>([
    { name: "Compte courant", number: suggestBankNumber(0), amount: "" },
  ]);
  const [useCash, setUseCash] = useState(false);
  const [cashName, setCashName] = useState("Caisse");
  const [cashAmount, setCashAmount] = useState("");
  const [stripeAmount, setStripeAmount] = useState("");
  const [showOthers, setShowOthers] = useState(false);
  const [others, setOthers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nextPeriod = useMemo(
    () => nextAccountingPeriod(periodStart, periodEnd),
    [periodStart, periodEnd]
  );

  const window = useMemo(() => {
    if (mode === "next_period") {
      return {
        periodStart: nextPeriod.startsOn,
        periodEnd: nextPeriod.endsOn,
        accountingStartDate: nextPeriod.startsOn,
      };
    }
    return { periodStart, periodEnd, accountingStartDate: today };
  }, [mode, nextPeriod.endsOn, nextPeriod.startsOn, periodEnd, periodStart, today]);

  function go(next: number) {
    setError(null);
    setStep(next);
  }

  function continueFromPeriod() {
    if (periodEnd < periodStart) {
      setError("La fin d’exercice précède le début.");
      return;
    }
    go(2);
  }

  function continueFromMode() {
    if (!mode) {
      setError("Choisissez quand commencer avec Obillz.");
      return;
    }
    if (mode !== "next_period" && !dateInPeriod(today, periodStart, periodEnd)) {
      setError("Aujourd’hui est en dehors de l’exercice choisi. Ajustez les dates, ou démarrez au prochain exercice.");
      return;
    }
    go(3);
  }

  function continueFromSituation() {
    if (banks.some((bank) => !bank.name.trim())) {
      setError("Chaque compte bancaire a besoin d’un nom.");
      return;
    }
    go(4);
  }

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await onDone({
        action: "onboarding",
        periodStart: window.periodStart,
        periodEnd: window.periodEnd,
        accountingStartDate: window.accountingStartDate,
        startMode: mode,
        historyImportStatus: mode === "resume_current" ? "planned" : "not_requested",
        banks: banks.map((bank) => ({
          name: bank.name.trim(),
          number: bank.number.trim(),
          amount: parseChfInput(bank.amount) || 0,
        })),
        useCash,
        cashName,
        cashAmount: useCash ? parseChfInput(cashAmount) || 0 : 0,
        useStripe: usesStripe,
        stripeAmount: usesStripe ? parseChfInput(stripeAmount) || 0 : 0,
        others: showOthers
          ? OTHER_OPENING_PRESETS.flatMap((preset) => {
              const amount = parseChfInput(others[preset.accountCode] || "");
              if (!amount) return [];
              return [{ accountCode: preset.accountCode, amount, side: preset.side }];
            })
          : [],
        includeExisting: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const active = number === step;
          const done = number < step;
          return (
            <li
              key={label}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                active ? "bg-[#1A23FF] text-white" : done ? "bg-[#EEF2FF] text-[#1A23FF]" : "bg-[#F1F5F9] text-[#64748B]"
              )}
            >
              {number}. {label}
            </li>
          );
        })}
      </ol>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {step === 1 ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Exercice comptable</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475569]">
            Choisissez la période utilisée actuellement par votre club pour établir ses comptes. Elle peut être différente de votre saison sportive.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[#334155]">Début
              <input className={fieldClass} type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </label>
            <label className="text-sm text-[#334155]">Fin
              <input className={fieldClass} type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
          </div>
          <p className="mt-4 text-sm text-[#64748B]">
            Proposition : {formatSwissDate(`${year}-01-01`)} → {formatSwissDate(`${year}-12-31`)}. Les deux dates restent modifiables.
          </p>
          <div className="mt-6">
            <ActionButton type="button" variant="premiumInline" onClick={continueFromPeriod}>Continuer</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">Quand souhaitez-vous commencer votre comptabilité Obillz ?</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChoiceCard
              selected={mode === "next_period"}
              title="Au début de mon prochain exercice"
              badge="Recommandé si vous changez de logiciel en fin d’exercice"
              text="Commencez avec Obillz lors de votre prochaine période comptable, sans reprendre l’historique de l’exercice actuel."
              detail={`Prochain exercice : ${formatSwissDate(nextPeriod.startsOn)}`}
              onClick={() => setMode("next_period")}
            />
            <ChoiceCard
              selected={mode === "resume_current"}
              title="Reprendre mon exercice actuel"
              text="Reprenez votre comptabilité depuis le début de l’exercice afin de disposer de rapports complets."
              detail={`Exercice : ${formatSwissDate(periodStart)} → ${formatSwissDate(periodEnd)}`}
              onClick={() => setMode("resume_current")}
            />
            <ChoiceCard
              selected={mode === "from_today"}
              title="Commencer à partir d’aujourd’hui"
              text="Indiquez simplement la situation actuelle du club. Obillz commencera à comptabiliser les nouvelles opérations à partir de cette date."
              detail={formatSwissDate(today)}
              onClick={() => setMode("from_today")}
            />
          </div>

          {mode === "resume_current" ? (
            <GlassCard padding="sm">
              <p className="text-sm font-semibold text-[#0F172A]">Import de l’historique</p>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Pour des rapports complets, il faudra reprendre les opérations déjà réalisées entre {formatSwissDate(periodStart)} et {formatSwissDate(today)}. Cette reprise détaillée arrive. Obillz ne reconstitue aucun historique tout seul.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {HISTORY_IMPORT_FORMATS.map((format) => (
                  <li key={format} className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#334155] ring-1 ring-inset ring-[rgba(15,23,42,0.06)]">
                    {format}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-[#475569]">
                En attendant, saisissez la situation actuelle. Les rapports couvriront la période à partir d’aujourd’hui.
              </p>
            </GlassCard>
          ) : null}

          {mode === "from_today" ? (
            <p className="text-sm text-[#475569]">
              Les rapports Obillz couvriront uniquement la période à partir de cette date.
            </p>
          ) : null}

          <div className="flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => go(1)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={continueFromMode}>Continuer</ActionButton>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1A23FF]">Situation de départ</p>
          <h2 className="mt-2 text-xl font-semibold text-[#0F172A]">au {formatSwissDate(window.accountingStartDate)}</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Indiquez ce que possède votre club au jour où commence la comptabilité Obillz.
          </p>

          <section className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Comptes bancaires</h3>
            <div className="mt-3 space-y-3">
              {banks.map((bank, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-[1fr_7rem_9rem_auto] sm:items-end">
                  <label className="text-sm text-[#334155]">Nom du compte
                    <input className={fieldClass} value={bank.name} placeholder="Compte courant Raiffeisen" onChange={(event) => updateBank(index, { name: event.target.value })} />
                  </label>
                  <label className="text-sm text-[#334155]">N°
                    <input className={fieldClass} value={bank.number} onChange={(event) => updateBank(index, { number: event.target.value })} />
                  </label>
                  <label className="text-sm text-[#334155]">Solde d’ouverture
                    <input className={fieldClass} inputMode="decimal" placeholder="CHF" value={bank.amount} onChange={(event) => updateBank(index, { amount: event.target.value })} />
                  </label>
                  {banks.length > 1 ? (
                    <button type="button" className="pb-2 text-sm text-[#64748B]" onClick={() => setBanks(banks.filter((_, item) => item !== index))}>
                      Retirer
                    </button>
                  ) : <span />}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-[#1A23FF]"
              onClick={() => setBanks([...banks, { name: "", number: suggestBankNumber(banks.length), amount: "" }])}
            >
              + Ajouter un compte bancaire
            </button>
          </section>

          <section className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Caisse</h3>
            <p className="mt-2 text-sm text-[#334155]">Votre club utilise-t-il une caisse en espèces ?</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className={pill(useCash)} onClick={() => setUseCash(true)}>Oui</button>
              <button type="button" className={pill(!useCash)} onClick={() => setUseCash(false)}>Non</button>
            </div>
            {useCash ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-[#334155]">Nom
                  <input className={fieldClass} value={cashName} onChange={(event) => setCashName(event.target.value)} />
                </label>
                <label className="text-sm text-[#334155]">Solde
                  <input className={fieldClass} inputMode="decimal" placeholder="CHF" value={cashAmount} onChange={(event) => setCashAmount(event.target.value)} />
                </label>
              </div>
            ) : null}
          </section>

          {usesStripe ? (
            <section className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Stripe</h3>
              <p className="mt-2 text-sm font-medium text-[#0F172A]">Compte Stripe</p>
              <p className="mt-1 max-w-xl text-sm text-[#475569]">
                Montants encaissés via Stripe mais pas encore transférés sur votre compte bancaire.
              </p>
              <label className="mt-3 block max-w-xs text-sm text-[#334155]">Solde d’ouverture
                <input className={fieldClass} inputMode="decimal" placeholder="0" value={stripeAmount} onChange={(event) => setStripeAmount(event.target.value)} />
              </label>
            </section>
          ) : null}

          <section className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Autres éléments</h3>
            <p className="mt-2 max-w-xl text-sm text-[#475569]">
              Ajoutez uniquement les éléments nécessaires pour représenter correctement la situation de votre club.
            </p>
            {showOthers ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {OTHER_OPENING_PRESETS.map((preset) => (
                  <label key={preset.accountCode} className="text-sm text-[#334155]">{preset.label}
                    <input
                      className={fieldClass}
                      inputMode="decimal"
                      placeholder="CHF"
                      value={others[preset.accountCode] || ""}
                      onChange={(event) => setOthers({ ...others, [preset.accountCode]: event.target.value })}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <button type="button" className="mt-3 text-sm font-semibold text-[#1A23FF]" onClick={() => setShowOthers(true)}>
                + Ajouter un élément
              </button>
            )}
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => go(2)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={continueFromSituation}>Continuer</ActionButton>
            <ActionButton
              type="button"
              variant="ghost"
              onClick={() => {
                if (banks.some((bank) => !bank.name.trim())) {
                  setError("Chaque compte bancaire a besoin d’un nom.");
                  return;
                }
                setShowOthers(false);
                setOthers({});
                go(4);
              }}
            >
              Passer cette étape
            </ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 4 ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Plan comptable suisse</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Obillz prépare le plan recommandé pour un club. Vous pourrez l’ajuster ensuite.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {Object.entries(ACCOUNT_CLASS_LABELS).map(([klass, label]) => (
              <li key={klass} className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm">
                <span className="font-semibold text-[#0F172A]">Classe {klass}</span>
                <span className="mt-1 block text-[#64748B]">{label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => go(3)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={() => go(5)}>Continuer</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 5 ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Mappings automatiques</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Chaque encaissement ou paiement Obillz propose le compte correspondant. Vous confirmez avant qu’il entre dans les chiffres officiels.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {Object.entries(DEFAULT_MAPPINGS)
              .filter(([kind]) => MAPPING_LABELS[kind])
              .map(([kind, code]) => {
                const account = RECOMMENDED_CHART.find((item) => item.systemCode === code);
                return (
                  <li key={kind} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm">
                    <span className="text-[#334155]">{MAPPING_LABELS[kind]}</span>
                    <span className="text-[#64748B]">{account ? `${account.number} ${account.name}` : code}</span>
                  </li>
                );
              })}
          </ul>
          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => go(4)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" onClick={() => go(6)}>Continuer</ActionButton>
          </div>
        </GlassCard>
      ) : null}

      {step === 6 ? (
        <GlassCard>
          <h2 className="text-xl font-semibold text-[#0F172A]">Résumé</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-[#64748B]">Exercice comptable</dt>
              <dd className="mt-1 font-medium text-[#0F172A]">
                {formatSwissDate(window.periodStart)} → {formatSwissDate(window.periodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Début de la comptabilité Obillz</dt>
              <dd className="mt-1 font-medium text-[#0F172A]">{formatSwissDate(window.accountingStartDate)}</dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Situation de départ</dt>
              <dd className="mt-2 space-y-1 text-[#0F172A]">
                {banks.map((bank) => (
                  <p key={bank.number}>{bank.name || "Compte bancaire"} : {formatChfAmount(parseChfInput(bank.amount) || 0)}</p>
                ))}
                {useCash ? <p>{cashName || "Caisse"} : {formatChfAmount(parseChfInput(cashAmount) || 0)}</p> : null}
                {usesStripe ? <p>Stripe : {formatChfAmount(parseChfInput(stripeAmount) || 0)}</p> : null}
              </dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Plan comptable</dt>
              <dd className="mt-1 font-medium text-[#0F172A]">Plan suisse recommandé</dd>
            </div>
          </dl>
          {mode === "resume_current" ? (
            <p className="mt-4 text-sm leading-relaxed text-[#475569]">
              L’import de l’historique n’est pas encore disponible. Tant qu’il n’est pas effectué, les rapports ne couvrent pas tout l’exercice : seules les opérations enregistrées dans Obillz à partir du {formatSwissDate(window.accountingStartDate)} y figurent.
            </p>
          ) : null}
          {mode === "next_period" ? (
            <p className="mt-4 text-sm leading-relaxed text-[#475569]">
              Votre comptabilité Obillz commencera le {formatSwissDate(window.accountingStartDate)}.
            </p>
          ) : null}
          <p className="mt-6 text-sm leading-relaxed text-[#334155]">
            À partir du {formatSwissDate(window.accountingStartDate)}, les nouveaux paiements et dépenses pourront alimenter automatiquement votre comptabilité.
          </p>
          <div className="mt-6 flex gap-3">
            <ActionButton type="button" variant="ghost" onClick={() => go(5)}>Retour</ActionButton>
            <ActionButton type="button" variant="premiumInline" disabled={busy} onClick={() => void confirm()}>
              Commencer ma comptabilité
            </ActionButton>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );

  function updateBank(index: number, patch: Partial<BankDraft>) {
    setBanks(banks.map((bank, item) => (item === index ? { ...bank, ...patch } : bank)));
  }
}

function ChoiceCard({
  selected,
  title,
  badge,
  text,
  detail,
  onClick,
}: {
  selected: boolean;
  title: string;
  badge?: string;
  text: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition",
        selected ? "border-[#1A23FF] ring-2 ring-[#1A23FF]/20" : "border-[rgba(15,23,42,0.08)] hover:border-[rgba(26,35,255,0.35)]"
      )}
    >
      <span className="text-base font-semibold text-[#0F172A]">{title}</span>
      {badge ? <span className="mt-2 text-xs font-medium text-[#1A23FF]">{badge}</span> : null}
      <span className="mt-3 flex-1 text-sm leading-relaxed text-[#475569]">{text}</span>
      <span className="mt-4 text-sm font-medium text-[#0F172A]">{detail}</span>
    </button>
  );
}

function pill(active: boolean): string {
  return cn(
    "rounded-full px-4 py-2 text-sm font-medium",
    active ? "bg-[#1A23FF] text-white" : "bg-[#F1F5F9] text-[#475569]"
  );
}
