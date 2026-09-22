"use client";

import { useRef } from "react";
import Image from "next/image";
import { useInView } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";

const SLIDES = [
  {
    id: "shop",
    title: "Boutique en ligne",
    text: "Vendez directement à votre communauté.",
    src: "/images/landing/club-growth-shop.png",
    width: 923,
    height: 520,
    sizes: "(max-width: 899px) 82vw, 420px",
  },
  {
    id: "pass",
    title: "Cartes supporters",
    text: "Transformez le soutien autour du club en revenus.",
    src: "/images/landing/club-growth-supporter.jpg",
    width: 768,
    height: 1024,
    sizes: "240px",
  },
  {
    id: "sale",
    title: "Ventes de soutien",
    text: "Suivez vos campagnes depuis OBILLZ.",
    src: "/images/landing/club-growth-sale.png",
    width: 984,
    height: 373,
    sizes: "(max-width: 899px) 82vw, 420px",
  },
] as const;

function Ribbon({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="lp-grow__group" aria-hidden={hidden || undefined}>
      {SLIDES.map((slide) => (
        <div key={slide.id} className="lp-grow__slide">
          <article className={`lp-grow__card lp-grow__card--${slide.id}`}>
            <div className="lp-grow__mock" aria-hidden>
              <div className={`lp-grow__visual lp-grow__visual--${slide.id}`}>
                <Image
                  src={slide.src}
                  alt=""
                  width={slide.width}
                  height={slide.height}
                  sizes={slide.sizes}
                  draggable={false}
                  className="lp-grow__visual-img"
                />
              </div>
            </div>
            <div className="lp-grow__card-copy">
              <h3>{slide.title}</h3>
              <p>{slide.text}</p>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}

export default function ClubGrowthSection() {
  const ribbonRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ribbonRef, { amount: 0.15 });

  return (
    <section className="lp-grow" aria-labelledby="lp-grow-title">
      <div className="lp-grow__wrap">
        <ScrollReveal>
          <header className="lp-grow__head">
            <h2 id="lp-grow-title" className="lp-grow__title">
              <span>Mieux gérer votre club, c’est une chose.</span>
              <span>Le faire grandir, c’en est une autre.</span>
            </h2>
            <p className="lp-grow__lead">
              <span>OBILLZ ne s’arrête pas à la gestion.</span>
              <span>
                De nouveaux outils pour <strong>générer des revenus</strong> et développer votre club.
              </span>
            </p>
          </header>
        </ScrollReveal>
      </div>

      <div
        ref={ribbonRef}
        className="lp-grow__marquee"
        role="region"
        aria-label="Boutique, cartes supporters et ventes de soutien"
      >
        <div className={`lp-grow__ribbon${inView ? "" : " is-paused"}`}>
          <Ribbon />
          <Ribbon hidden />
        </div>
      </div>
    </section>
  );
}
