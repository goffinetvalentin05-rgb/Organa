"use client";

import { useMemo, useState } from "react";
import { formatCardDuration, formatHourValue, SimBars, SimCard, SimHero, SimStepper } from "@/components/landing/simulator-controls";

const SEASON_MONTHS = 10;
const ACTIVE_WEEKS = 43;

type TimeState = {
  feesOn: boolean;
  fees: number;
  reminders: number;
  invoicesOn: boolean;
  invoices: number;
  meetingsOn: boolean;
  meetings: number;
  meetingTasks: number;
  eventsOn: boolean;
  events: number;
  people: number;
  slots: number;
  tasksOn: boolean;
  tasks: number;
};

const initial: TimeState = {
  feesOn: true,
  fees: 150,
  reminders: 30,
  invoicesOn: true,
  invoices: 30,
  meetingsOn: true,
  meetings: 2,
  meetingTasks: 6,
  eventsOn: true,
  events: 4,
  people: 30,
  slots: 12,
  tasksOn: true,
  tasks: 10,
};

export default function TimeSimulator() {
  const [state, setState] = useState<TimeState>(initial);
  const [open, setOpen] = useState(false);
  const patch = (partial: Partial<TimeState>) => setState((current) => ({ ...current, ...partial }));

  const model = useMemo(() => {
    const fees = state.feesOn ? state.fees * (20 / 60) + state.reminders * 2 : 0;
    const invoicesMonth = state.invoicesOn ? state.invoices * 2 : 0;
    const meetingsMonth = state.meetingsOn ? state.meetings * 15 + state.meetings * state.meetingTasks * 2 : 0;
    const events = state.eventsOn ? state.events * (30 + state.people + state.slots * 3) : 0;
    const tasks = state.tasksOn ? state.tasks * 2 * ACTIVE_WEEKS : 0;
    const invoices = invoicesMonth * SEASON_MONTHS;
    const meetings = meetingsMonth * SEASON_MONTHS;
    const total = fees + invoices + meetings + events + tasks;
    return { fees, invoices, invoicesMonth, meetings, meetingsMonth, events, tasks, total };
  }, [state]);

  return (
    <section className="lp-calc">
      <div className="lp-calc__wrap">
        <SimHero
          title="Calculez le temps que votre comité peut récupérer."
          lead="Une estimation basée sur les tâches réellement gérées par votre club."
        />

        <div className="lp-calc__layout">
          <div className="lp-calc__functions">
            <SimCard
              title="Cotisations"
              when="Par saison"
              on={state.feesOn}
              onToggle={() => patch({ feesOn: !state.feesOn })}
              result={formatCardDuration(model.fees, "saison")}
            >
              <SimStepper label="Nombre de cotisations à gérer" value={state.fees} min={20} max={1000} disabled={!state.feesOn} onChange={(fees) => patch({ fees })} />
              <SimStepper label="Nombre de relances habituellement nécessaires" value={state.reminders} min={0} max={500} disabled={!state.feesOn} onChange={(reminders) => patch({ reminders })} />
            </SimCard>

            <SimCard
              title="Factures"
              when="Par mois"
              on={state.invoicesOn}
              onToggle={() => patch({ invoicesOn: !state.invoicesOn })}
              result={formatCardDuration(model.invoicesMonth, "mois")}
            >
              <SimStepper label="Nombre de factures créées ou suivies par mois" value={state.invoices} min={0} max={300} disabled={!state.invoicesOn} onChange={(invoices) => patch({ invoices })} />
            </SimCard>

            <SimCard
              title="Réunions & PV"
              when="Par mois"
              on={state.meetingsOn}
              onToggle={() => patch({ meetingsOn: !state.meetingsOn })}
              result={formatCardDuration(model.meetingsMonth, "mois")}
            >
              <SimStepper label="Nombre de réunions par mois" value={state.meetings} min={0} max={12} disabled={!state.meetingsOn} onChange={(meetings) => patch({ meetings })} />
              <SimStepper label="Nombre moyen de tâches issues d’une réunion" value={state.meetingTasks} min={0} max={30} disabled={!state.meetingsOn} onChange={(meetingTasks) => patch({ meetingTasks })} />
            </SimCard>

            <SimCard
              title="Manifestations & plannings"
              when="Par saison"
              on={state.eventsOn}
              onToggle={() => patch({ eventsOn: !state.eventsOn })}
              result={formatCardDuration(model.events, "saison")}
            >
              <SimStepper label="Nombre de manifestations par saison" value={state.events} min={0} max={40} disabled={!state.eventsOn} onChange={(events) => patch({ events })} />
              <SimStepper label="Nombre moyen de personnes / bénévoles à répartir" value={state.people} min={0} max={300} disabled={!state.eventsOn} onChange={(people) => patch({ people })} />
              <SimStepper label="Nombre moyen de créneaux / postes à organiser" value={state.slots} min={0} max={80} disabled={!state.eventsOn} onChange={(slots) => patch({ slots })} />
            </SimCard>

            <SimCard
              title="Suivi des tâches"
              when="Par semaine"
              on={state.tasksOn}
              onToggle={() => patch({ tasksOn: !state.tasksOn })}
              result={formatCardDuration(model.tasks, "saison")}
            >
              <SimStepper label="Nombre de tâches suivies chaque semaine" value={state.tasks} min={0} max={80} disabled={!state.tasksOn} onChange={(tasks) => patch({ tasks })} />
            </SimCard>
          </div>

          <aside className={open ? "lp-calc__result is-open" : "lp-calc__result"} aria-live="polite">
            <p className="lp-calc__total">
              <span className="lp-calc__total-value">{formatHourValue(model.total)}</span>
              <span className="lp-calc__total-unit">H / SAISON</span>
            </p>
            <p className="lp-calc__avg">≈ {formatHourValue(model.total / SEASON_MONTHS)} h / mois en moyenne</p>
            <p className="lp-calc__split">Répartition sur la saison</p>
            <SimBars
              rows={[
                { label: "Cotisations", value: model.fees, text: `${formatHourValue(model.fees)} h` },
                { label: "Manifestations", value: model.events, text: `${formatHourValue(model.events)} h` },
                { label: "Réunions & PV", value: model.meetings, text: `${formatHourValue(model.meetings)} h` },
                { label: "Factures", value: model.invoices, text: `${formatHourValue(model.invoices)} h` },
                { label: "Suivi des tâches", value: model.tasks, text: `${formatHourValue(model.tasks)} h` },
              ]}
            />
            <button type="button" className={open ? "lp-calc__details is-open" : "lp-calc__details"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              Voir comment l’estimation est calculée
              <svg viewBox="0 0 16 16" aria-hidden>
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open ? (
              <div className="lp-calc__hypo">
                <p>
                  <strong>Cotisations — par saison</strong>
                  20 secondes économisées par cotisation suivie. 2 minutes économisées par relance simplifiée / automatisée.
                </p>
                <p>
                  <strong>Factures — par mois</strong>
                  2 minutes économisées par facture. Le temps mensuel est rapporté à une saison de 10 mois.
                </p>
                <p>
                  <strong>Réunions & PV — par mois</strong>
                  15 minutes économisées par réunion. 2 minutes économisées par tâche grâce à sa création, attribution et son suivi dans OBILLZ. Le temps mensuel est rapporté à une saison de 10 mois.
                </p>
                <p>
                  <strong>Manifestations & plannings — par saison</strong>
                  Pour chaque manifestation : 30 minutes de base, plus 1 minute par personne, plus 3 minutes par créneau / poste. Ce temps est multiplié par le nombre de manifestations.
                </p>
                <p>
                  <strong>Suivi des tâches — par semaine</strong>
                  2 minutes économisées par tâche suivie, sur 43 semaines, pour représenter environ 10 mois de saison active.
                </p>
              </div>
            ) : null}
            <p className="lp-calc__note">Ces estimations sont indicatives et servent à donner un ordre de grandeur.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
