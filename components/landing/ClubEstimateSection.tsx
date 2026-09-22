import Link from "next/link";

function TimeVisual() {
  return (
    <div className="lp-gate__stage" aria-hidden>
      <svg className="lp-gate__clock" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="52" fill="#ffffff" stroke="rgba(26,35,255,0.12)" strokeWidth="8" />
        <circle
          className="lp-gate__arc"
          cx="70"
          cy="70"
          r="52"
          fill="none"
          stroke="#1A23FF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="92 250"
        />
        <line className="lp-gate__hand lp-gate__hand--h" x1="70" y1="70" x2="70" y2="38" />
        <line className="lp-gate__hand lp-gate__hand--m" x1="70" y1="70" x2="96" y2="78" />
        <circle cx="70" cy="70" r="4" fill="#1A23FF" />
      </svg>
      <span className="lp-gate__task lp-gate__task--a">
        <i />
        <i />
      </span>
      <span className="lp-gate__task lp-gate__task--b">
        <i />
        <i />
      </span>
      <span className="lp-gate__task lp-gate__task--c">
        <i />
        <i />
      </span>
    </div>
  );
}

function RevenueVisual() {
  return (
    <div className="lp-gate__stage lp-gate__stage--revenue" aria-hidden>
      <span className="lp-gate__pass">
        <span className="lp-gate__crest" />
        <span className="lp-gate__pass-lines">
          <i />
          <i />
        </span>
        <svg className="lp-gate__qr" viewBox="0 0 24 24">
          <rect width="24" height="24" rx="3" fill="#ffffff" />
          <path fill="#0b1220" d="M3 3h6v6H3zm2 2v2h2V5zM15 3h6v6h-6zm2 2v2h2V5zM3 15h6v6H3zm2 2v2h2v-2zM13 13h2v2h-2zm4 0h4v2h-2v2h-2zm-4 4h2v4h-2zm4 2h2v2h-2z" />
        </svg>
      </span>
      <span className="lp-gate__bars">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="lp-gate__slip">
        <i />
        <i />
        <i />
      </span>
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
