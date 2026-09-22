"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { easePremium } from "@/components/landing/landing-motion";

const QR_ROWS = ["1110111", "1000101", "1011101", "1000001", "1110111", "0001010", "1101111"];

function Jersey({ soft = false }: { soft?: boolean }) {
  return (
    <svg className="lp-grow__jersey" viewBox="0 0 84 92" aria-hidden>
      <path
        fill={soft ? "#c9d0ff" : "#1A23FF"}
        d="M30 10 42 20 54 10l18 12-8 14v44H20V36L12 22z"
      />
      <path fill="#ffffff" d="M34 10h16L42 22z" />
      <path
        fill={soft ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)"}
        d="M42 28v40"
        stroke={soft ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"}
        strokeWidth="3"
      />
    </svg>
  );
}

function QrMark() {
  return (
    <span className="lp-grow__qr">
      {QR_ROWS.map((row, y) => (
        <span key={y} className="lp-grow__qr-row">
          {row.split("").map((cell, x) => (
            <span key={x} className={cell === "1" ? "is-on" : ""} />
          ))}
        </span>
      ))}
    </span>
  );
}

function ShopCard({ play, still }: { play: boolean; still: boolean }) {
  const [cart, setCart] = useState(still ? 1 : 0);

  useEffect(() => {
    if (still) {
      setCart(1);
      return;
    }
    if (!play) return;
    const timer = window.setTimeout(() => setCart(1), 980);
    return () => window.clearTimeout(timer);
  }, [play, still]);

  return (
    <article className="lp-grow__card lp-grow__card--shop">
      <div className="lp-grow__mock" aria-hidden>
        <div className="lp-grow__shop">
          <div className="lp-grow__shop-bar">
            <span>FC Les Étoiles</span>
            <span className={`lp-grow__cart${cart > 0 ? " is-on" : ""}`}>{cart}</span>
          </div>
          <motion.div
            className="lp-grow__hero-product"
            initial={still ? false : { opacity: 0, y: 16 }}
            animate={play || still ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.75, ease: easePremium }}
          >
            <span className="lp-grow__photo">
              <Jersey />
            </span>
            <span className="lp-grow__meta">
              <span>Maillot domicile</span>
              <strong>CHF 45</strong>
            </span>
          </motion.div>
          <div className="lp-grow__side-product">
            <span className="lp-grow__photo lp-grow__photo--sm">
              <Jersey soft />
            </span>
            <span className="lp-grow__meta">
              <span>Training</span>
              <strong>CHF 32</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="lp-grow__card-copy">
        <h3>Boutique en ligne</h3>
        <p>Vendez directement à votre communauté.</p>
      </div>
    </article>
  );
}

function PassCard({ play, still }: { play: boolean; still: boolean }) {
  return (
    <article className="lp-grow__card lp-grow__card--pass">
      <div className="lp-grow__mock" aria-hidden>
        <motion.div
          className="lp-grow__pass"
          initial={still ? false : { opacity: 0, y: 18, rotate: -6 }}
          animate={play || still ? { opacity: 1, y: 0, rotate: -2.5 } : undefined}
          transition={{ duration: 0.9, ease: easePremium }}
        >
          <div className="lp-grow__pass-top">
            <span className="lp-grow__crest" />
            <span>FC Les Étoiles</span>
          </div>
          <p className="lp-grow__pass-kicker">Supporter</p>
          <p className="lp-grow__pass-name">Camille Rossi</p>
          <p className="lp-grow__pass-num">N° 128</p>
          <motion.div
            initial={still ? false : { opacity: 0, y: 8 }}
            animate={play || still ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: still ? 0 : 0.55, ease: easePremium }}
          >
            <QrMark />
          </motion.div>
          <span className={`lp-grow__status${play || still ? " is-on" : ""}`}>Valide</span>
        </motion.div>
      </div>
      <div className="lp-grow__card-copy">
        <h3>Cartes supporters</h3>
        <p>Transformez le soutien autour du club en revenus.</p>
      </div>
    </article>
  );
}

function SaleCard({ play, still }: { play: boolean; still: boolean }) {
  const [step, setStep] = useState(still ? 2 : 0);

  useEffect(() => {
    if (still) {
      setStep(2);
      return;
    }
    if (!play) return;
    const mid = window.setTimeout(() => setStep(1), 520);
    const done = window.setTimeout(() => setStep(2), 1280);
    return () => {
      window.clearTimeout(mid);
      window.clearTimeout(done);
    };
  }, [play, still]);

  const sales = step === 0 ? 0 : step === 1 ? 74 : 86;
  const width = step === 0 ? "0%" : step === 1 ? "62%" : "78%";

  return (
    <article className="lp-grow__card lp-grow__card--sale">
      <div className="lp-grow__mock" aria-hidden>
        <div className="lp-grow__sale">
          <div className="lp-grow__sale-head">
            <span>Fondue 2026</span>
            <strong>{sales}</strong>
          </div>
          <p className="lp-grow__sale-goal">Objectif 120</p>
          <span className="lp-grow__track">
            <span className="lp-grow__bar" style={{ width }} />
          </span>
          <ul>
            <li>
              <span>Léa M.</span>
              <span>U15</span>
              <span>14</span>
            </li>
            <li>
              <span>Noah P.</span>
              <span>Seniors</span>
              <span>9</span>
            </li>
            <li className={step >= 2 ? "is-on" : ""}>
              <span>Commande</span>
              <span />
              <span>+1</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="lp-grow__card-copy">
        <h3>Ventes de soutien</h3>
        <p>Lancez et suivez vos campagnes depuis OBILLZ.</p>
      </div>
    </article>
  );
}

export default function ClubGrowthSection() {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion === true;
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.28, once: true });
  const play = inView && !still;

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

        <div ref={stageRef} className="lp-grow__stage">
          <ShopCard play={play} still={still} />
          <PassCard play={play} still={still} />
          <SaleCard play={play} still={still} />
        </div>
      </div>
    </section>
  );
}
