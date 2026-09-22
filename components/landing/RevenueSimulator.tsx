"use client";

import { useMemo, useState } from "react";
import { formatChf, SimBars, SimCard, SimHero, SimStepper } from "@/components/landing/simulator-controls";

type RevenueState = {
  cardsOn: boolean;
  cards: number;
  cardNet: number;
  salesOn: boolean;
  campaigns: number;
  sales: number;
  saleProfit: number;
  shopOn: boolean;
  orders: number;
  orderProfit: number;
  months: number;
};

const initial: RevenueState = {
  cardsOn: true,
  cards: 100,
  cardNet: 30,
  salesOn: true,
  campaigns: 2,
  sales: 200,
  saleProfit: 8,
  shopOn: true,
  orders: 20,
  orderProfit: 15,
  months: 10,
};

function seasonLabel(amount: number) {
  return `${formatChf(amount)} CHF / saison`;
}

export default function RevenueSimulator() {
  const [state, setState] = useState<RevenueState>(initial);
  const patch = (partial: Partial<RevenueState>) => setState((current) => ({ ...current, ...partial }));

  const model = useMemo(() => {
    const cards = state.cardsOn ? state.cards * state.cardNet : 0;
    const sales = state.salesOn ? state.campaigns * state.sales * state.saleProfit : 0;
    const shop = state.shopOn ? state.orders * state.orderProfit * state.months : 0;
    return { cards, sales, shop, total: cards + sales + shop };
  }, [state]);

  return (
    <section className="lp-calc">
      <div className="lp-calc__wrap">
        <SimHero
          title="Estimez le potentiel de revenus de votre club."
          lead="Construisez votre projection à partir des outils que votre club souhaite utiliser."
        />

        <div className="lp-calc__layout">
          <div className="lp-calc__functions">
            <SimCard
              title="Cartes supporters"
              when="Par saison"
              on={state.cardsOn}
              onToggle={() => patch({ cardsOn: !state.cardsOn })}
              result={seasonLabel(model.cards)}
            >
              <SimStepper label="Nombre de cartes que vous pensez vendre" value={state.cards} min={0} max={2000} disabled={!state.cardsOn} onChange={(cards) => patch({ cards })} />
              <SimStepper label="Revenu net estimé par carte" value={state.cardNet} min={0} max={500} suffix="CHF" disabled={!state.cardsOn} onChange={(cardNet) => patch({ cardNet })} />
            </SimCard>

            <SimCard
              title="Ventes de soutien"
              when="Par saison"
              hint="Fondue, vin, chocolat…"
              on={state.salesOn}
              onToggle={() => patch({ salesOn: !state.salesOn })}
              result={seasonLabel(model.sales)}
            >
              <SimStepper label="Nombre de campagnes par saison" value={state.campaigns} min={0} max={12} disabled={!state.salesOn} onChange={(campaigns) => patch({ campaigns })} />
              <SimStepper label="Nombre moyen de ventes par campagne" value={state.sales} min={0} max={2000} disabled={!state.salesOn} onChange={(sales) => patch({ sales })} />
              <SimStepper label="Bénéfice net moyen par vente" value={state.saleProfit} min={0} max={200} suffix="CHF" disabled={!state.salesOn} onChange={(saleProfit) => patch({ saleProfit })} />
            </SimCard>

            <SimCard
              title="Boutique en ligne"
              when="Par saison"
              on={state.shopOn}
              onToggle={() => patch({ shopOn: !state.shopOn })}
              result={seasonLabel(model.shop)}
            >
              <SimStepper label="Commandes moyennes par mois" value={state.orders} min={0} max={500} disabled={!state.shopOn} onChange={(orders) => patch({ orders })} />
              <SimStepper label="Bénéfice net moyen par commande" value={state.orderProfit} min={0} max={300} suffix="CHF" disabled={!state.shopOn} onChange={(orderProfit) => patch({ orderProfit })} />
              <SimStepper label="Nombre de mois actifs" value={state.months} min={1} max={12} disabled={!state.shopOn} onChange={(months) => patch({ months })} />
            </SimCard>
          </div>

          <aside className="lp-calc__result" aria-live="polite">
            <p className="lp-calc__kicker">Potentiel de revenus</p>
            <p className="lp-calc__total">
              <span className="lp-calc__total-value">{formatChf(model.total)}</span>
              <span className="lp-calc__total-unit">CHF / SAISON</span>
            </p>
            <SimBars
              rows={[
                { label: "Cartes supporters", value: model.cards, text: `${formatChf(model.cards)} CHF` },
                { label: "Ventes de soutien", value: model.sales, text: `${formatChf(model.sales)} CHF` },
                { label: "Boutique", value: model.shop, text: `${formatChf(model.shop)} CHF` },
              ]}
            />
            <p className="lp-calc__note">Projection basée uniquement sur vos hypothèses. Les résultats réels peuvent varier.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
