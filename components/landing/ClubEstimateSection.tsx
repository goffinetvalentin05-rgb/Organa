import Link from "next/link";

function TimeVisual() {
  return (
    <div className="lp-gate__stage" aria-hidden>
      <img className="lp-gate__visual" src="/images/landing/gate-temps.jpg" alt="" />
    </div>
  );
}

function RevenueVisual() {
  return (
    <div className="lp-gate__stage" aria-hidden>
      <img className="lp-gate__visual" src="/images/landing/gate-revenus.jpg" alt="" />
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ClubEstimateSection() {
  return (
    <section className="lp-gate" aria-labelledby="lp-gate-title">
      <div className="lp-gate__wrap">
        <header className="lp-gate__head">
          <h2 id="lp-gate-title" className="lp-gate__title">
            Découvrez ce qu’OBILLZ peut faire gagner à votre club.
          </h2>
          <p className="lp-gate__lead">
            Du <strong>temps</strong> pour votre comité. De nouveaux <strong>revenus</strong> pour votre club.
          </p>
        </header>

        <div className="lp-gate__grid">
          <Link href="/simulateur/temps" className="lp-gate__card lp-gate__card--time">
            <TimeVisual />
            <div className="lp-gate__copy">
              <h3>Temps récupéré</h3>
              <p className="lp-gate__phrase">Combien d’heures votre comité pourrait-il récupérer ?</p>
              <span className="lp-gate__cta">
                Estimer mon temps gagné
                <Arrow />
              </span>
            </div>
          </Link>

          <Link href="/simulateur/revenus" className="lp-gate__card lp-gate__card--revenue">
            <RevenueVisual />
            <div className="lp-gate__copy">
              <h3>Revenus</h3>
              <p className="lp-gate__phrase">Combien votre club pourrait-il générer en plus ?</p>
              <span className="lp-gate__cta">
                Estimer mes revenus
                <Arrow />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
