"use client";

import { useI18n } from "@/components/I18nProvider";

type TrustLogo = {
  id: string;
  name: string;
  src: string;
  kind: "infra" | "club";
};

const LOGOS: TrustLogo[] = [
  {
    id: "stripe",
    name: "Stripe",
    src: "/images/trust/stripe.svg",
    kind: "infra",
  },
  {
    id: "resend",
    name: "Resend",
    src: "/images/trust/resend.svg",
    kind: "infra",
  },
  {
    id: "fontenais",
    name: "FC Fontenais",
    src: "/images/trust/fc-fontenais.png",
    kind: "club",
  },
  {
    id: "porrentruy",
    name: "FC Porrentruy",
    src: "/images/trust/fc-porrentruy.png",
    kind: "club",
  },
];

function TrustRow({ copy, sizer = false }: { copy: "a" | "b" | "measure"; sizer?: boolean }) {
  return (
    <ul
      className={`lp-hero-trust__row${sizer ? " lp-hero-trust__row--sizer" : ""}`}
      aria-hidden={sizer || copy !== "a" ? true : undefined}
    >
      {LOGOS.map((item) => (
        <li key={`${copy}-${item.id}`} className={`lp-hero-trust__item lp-hero-trust__item--${item.kind}`}>
          <img
            src={item.src}
            alt={!sizer && copy === "a" ? item.name : ""}
            className={`lp-hero-trust__logo lp-hero-trust__logo--${item.id}`}
            draggable={false}
          />
        </li>
      ))}
    </ul>
  );
}

export default function HeroTrustRibbon() {
  const { t } = useI18n();

  return (
    <div className="lp-hero-trust">
      <p className="lp-hero-trust__label">{t("marketing.hero.trustLine")}</p>
      <div className="lp-hero-trust__marquee" aria-label={t("marketing.hero.trustAria")}>
        <TrustRow copy="measure" sizer />
        <div className="lp-hero-trust__ribbon">
          <TrustRow copy="a" />
          <TrustRow copy="b" />
        </div>
      </div>
    </div>
  );
}
