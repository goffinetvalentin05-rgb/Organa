"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { easePremium } from "@/components/landing/landing-motion";

type GrowCard = "shop" | "pass" | "sale";
type SpotlightRole = "idle" | "active" | "dimmed";

function useFineHover() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return fine;
}

function cardMotion(delay: number, play: boolean, still: boolean, role: SpotlightRole, id: GrowCard) {
  const spotlight = role !== "idle";
  const wide = id === "sale";
  return {
    initial: still ? false : { opacity: 0, y: 22, scale: 1, x: 0 },
    animate:
      play || still
        ? {
            opacity: role === "dimmed" ? 0.74 : 1,
            x: role === "active" ? (id === "shop" ? 18 : id === "pass" ? -18 : 0) : 0,
            y: role === "active" ? (wide ? -18 : -22) : role === "dimmed" ? 10 : 0,
            scale: role === "active" ? (wide ? 1.08 : 1.11) : role === "dimmed" ? 0.96 : 1,
            transition: {
              duration: spotlight ? 0.58 : 0.68,
              delay: spotlight || still ? 0 : delay,
              ease: easePremium,
            },
          }
        : undefined,
    transition: { duration: 0.58, ease: easePremium },
  };
}

function spotlightClass(role: SpotlightRole) {
  if (role === "active") return " is-active";
  if (role === "dimmed") return " is-dimmed";
  return "";
}

function ShopCard({
  play,
  still,
  role,
  onActivate,
  onDeactivate,
}: {
  play: boolean;
  still: boolean;
  role: SpotlightRole;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <motion.article
      className={`lp-grow__card lp-grow__card--shop${spotlightClass(role)}`}
      {...cardMotion(0, play, still, role, "shop")}
      onHoverStart={onActivate}
      onHoverEnd={onDeactivate}
    >
      <div className="lp-grow__mock" aria-hidden>
        <div className="lp-grow__visual lp-grow__visual--shop">
          <Image
            src="/images/landing/club-growth-shop.png"
            alt=""
            width={923}
            height={520}
            sizes="(max-width: 980px) 92vw, 46vw"
            className="lp-grow__visual-img"
          />
        </div>
      </div>
      <div className="lp-grow__card-copy">
        <h3>Boutique en ligne</h3>
        <p>Vendez directement à votre communauté.</p>
      </div>
    </motion.article>
  );
}

function PassCard({
  play,
  still,
  role,
  onActivate,
  onDeactivate,
}: {
  play: boolean;
  still: boolean;
  role: SpotlightRole;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <motion.article
      className={`lp-grow__card lp-grow__card--pass${spotlightClass(role)}`}
      {...cardMotion(0.1, play, still, role, "pass")}
      onHoverStart={onActivate}
      onHoverEnd={onDeactivate}
    >
      <div className="lp-grow__mock" aria-hidden>
        <div className="lp-grow__visual lp-grow__visual--pass">
          <Image
            src="/images/landing/club-growth-supporter.jpg"
            alt=""
            fill
            sizes="(max-width: 980px) 72vw, 22rem"
            className="lp-grow__visual-img"
          />
        </div>
      </div>
      <div className="lp-grow__card-copy">
        <h3>Cartes supporters</h3>
        <p>Transformez le soutien autour du club en revenus.</p>
      </div>
    </motion.article>
  );
}

function SaleCard({
  play,
  still,
  role,
  onActivate,
  onDeactivate,
}: {
  play: boolean;
  still: boolean;
  role: SpotlightRole;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <motion.article
      className={`lp-grow__card lp-grow__card--sale${spotlightClass(role)}`}
      {...cardMotion(0.2, play, still, role, "sale")}
      onHoverStart={onActivate}
      onHoverEnd={onDeactivate}
    >
      <div className="lp-grow__mock" aria-hidden>
        <div className="lp-grow__visual lp-grow__visual--sale">
          <Image
            src="/images/landing/club-growth-sale.png"
            alt=""
            width={984}
            height={373}
            sizes="(max-width: 980px) 92vw, 80vw"
            className="lp-grow__visual-img"
          />
        </div>
      </div>
      <div className="lp-grow__card-copy">
        <h3>Ventes de soutien</h3>
        <p>Suivez vos campagnes depuis OBILLZ.</p>
      </div>
    </motion.article>
  );
}

export default function ClubGrowthSection() {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion === true;
  const fineHover = useFineHover();
  const stageRef = useRef<HTMLDivElement>(null);
  const clearRef = useRef<number | null>(null);
  const [active, setActive] = useState<GrowCard | null>(null);
  const inView = useInView(stageRef, { amount: 0.28, once: true });
  const play = inView && !still;
  const spotlight = !still && fineHover;

  useEffect(() => {
    return () => {
      if (clearRef.current) window.clearTimeout(clearRef.current);
    };
  }, []);

  const activate = (id: GrowCard) => {
    if (!spotlight) return;
    if (clearRef.current) window.clearTimeout(clearRef.current);
    setActive(id);
  };

  const deactivate = (id: GrowCard) => {
    if (!spotlight) return;
    clearRef.current = window.setTimeout(() => {
      setActive((current) => (current === id ? null : current));
    }, 40);
  };

  const role = (id: GrowCard): SpotlightRole => {
    if (!active) return "idle";
    return active === id ? "active" : "dimmed";
  };

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

        <div ref={stageRef} className={`lp-grow__stage${active ? " is-spotlight" : ""}`}>
          <ShopCard
            play={play}
            still={still}
            role={role("shop")}
            onActivate={() => activate("shop")}
            onDeactivate={() => deactivate("shop")}
          />
          <PassCard
            play={play}
            still={still}
            role={role("pass")}
            onActivate={() => activate("pass")}
            onDeactivate={() => deactivate("pass")}
          />
          <SaleCard
            play={play}
            still={still}
            role={role("sale")}
            onActivate={() => activate("sale")}
            onDeactivate={() => deactivate("sale")}
          />
        </div>
      </div>
    </section>
  );
}
