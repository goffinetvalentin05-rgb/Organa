"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInView, useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";

const SLIDES = [
  {
    id: "shop",
    title: "Boutique en ligne",
    text: "Vendez directement à votre communauté.",
    src: "/images/landing/club-growth-shop.png",
    width: 923,
    height: 520,
    sizes: "(max-width: 900px) 78vw, 680px",
  },
  {
    id: "pass",
    title: "Cartes supporters",
    text: "Transformez le soutien autour du club en revenus.",
    src: "/images/landing/club-growth-supporter.jpg",
    width: 768,
    height: 1024,
    sizes: "280px",
  },
  {
    id: "sale",
    title: "Ventes de soutien",
    text: "Suivez vos campagnes depuis OBILLZ.",
    src: "/images/landing/club-growth-sale.png",
    width: 984,
    height: 373,
    sizes: "(max-width: 900px) 78vw, 680px",
  },
] as const;

type Slide = (typeof SLIDES)[number];

const LOOP: Slide[] = [SLIDES[2], ...SLIDES, SLIDES[0]];
const AUTO_MS = 4500;
const HOLD_MS = 7000;

function toReal(index: number) {
  return (index - 1 + SLIDES.length) % SLIDES.length;
}

export default function ClubGrowthSection() {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion === true;
  const showcaseRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(1);
  const animateRef = useRef(true);
  const dragRef = useRef<{ x: number; active: boolean } | null>(null);
  const suppressClick = useRef(false);
  const inView = useInView(showcaseRef, { amount: 0.35, margin: "0px 0px -10% 0px" });
  const [index, setIndex] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [hold, setHold] = useState(0);

  indexRef.current = index;
  animateRef.current = animate;

  const real = toReal(index);

  const pause = () => setHold(Date.now() + HOLD_MS);

  const settle = (next: number) => {
    if (still) {
      const landed = next <= 0 ? SLIDES.length : next >= LOOP.length - 1 ? 1 : next;
      animateRef.current = false;
      setAnimate(false);
      setIndex(landed);
      return;
    }
    if (next < 0 || next > LOOP.length - 1) return;
    animateRef.current = true;
    setAnimate(true);
    setIndex(next);
  };

  const step = (delta: number) => {
    pause();
    const current = still ? toReal(indexRef.current) + 1 : indexRef.current;
    settle(current + delta);
  };

  const goTo = (realIndex: number) => {
    if (toReal(indexRef.current) === realIndex) return;
    pause();
    settle(realIndex + 1);
  };

  useEffect(() => {
    const node = railRef.current;
    if (!node) return;

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== node || event.propertyName !== "transform") return;
      if (!animateRef.current) return;
      const current = indexRef.current;
      if (current !== 0 && current !== LOOP.length - 1) return;
      animateRef.current = false;
      setAnimate(false);
      setIndex(current === 0 ? SLIDES.length : 1);
    };

    node.addEventListener("transitionend", onEnd);
    return () => node.removeEventListener("transitionend", onEnd);
  }, []);

  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() => {
      animateRef.current = true;
      setAnimate(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  useEffect(() => {
    if (still || !inView || hovering || dragging) return;
    let interval = 0;
    const wait = Math.max(0, hold - Date.now());
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setIndex((current) => (current >= LOOP.length - 1 ? current : current + 1));
      }, AUTO_MS);
    }, wait);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [still, inView, hovering, dragging, hold]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = { x: event.clientX, active: false };
    setHold(Date.now() + HOLD_MS);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.active && Math.abs(dx) < 8) return;
    if (!drag.active) {
      drag.active = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragX(dx);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const moved = drag.active;
    dragRef.current = null;
    if (moved) suppressClick.current = true;
    setDragging(false);
    setDragX(0);
    if (moved && Math.abs(dx) > 48) {
      pause();
      const current = still ? toReal(indexRef.current) + 1 : indexRef.current;
      settle(current + (dx < 0 ? 1 : -1));
    }
  };

  const railStyle = {
    "--index": index,
    "--drag": `${dragX}px`,
  } as CSSProperties;

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

        <div
          ref={showcaseRef}
          className="lp-grow__showcase"
          role="region"
          aria-roledescription="carrousel"
          aria-label="Outils pour faire grandir le club"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocusCapture={() => setHovering(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setHovering(false);
            }
          }}
        >
          <div
            className="lp-grow__viewport"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              ref={railRef}
              className={`lp-grow__rail${animate && !dragging ? "" : " is-instant"}${dragging ? " is-dragging" : ""}`}
              style={railStyle}
            >
              {LOOP.map((slide, slideIndex) => {
                const current = slideIndex === index;
                return (
                  <div
                    key={`${slide.id}-${slideIndex}`}
                    className={`lp-grow__slide${current ? " is-current" : ""}`}
                    aria-hidden={current ? undefined : true}
                    onClick={() => {
                      if (suppressClick.current) {
                        suppressClick.current = false;
                        return;
                      }
                      if (Math.abs(slideIndex - index) !== 1) return;
                      pause();
                      settle(slideIndex);
                    }}
                  >
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
                );
              })}
            </div>
          </div>

          <div className="lp-grow__controls">
            <button
              type="button"
              className="lp-grow__arrow"
              aria-label="Fonctionnalité précédente"
              onClick={() => step(-1)}
            >
              <ChevronLeft aria-hidden strokeWidth={1.75} />
            </button>
            <div className="lp-grow__dots" role="tablist" aria-label="Fonctionnalités">
              {SLIDES.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  className={`lp-grow__dot${real === slideIndex ? " is-on" : ""}`}
                  aria-label={slide.title}
                  aria-selected={real === slideIndex}
                  onClick={() => goTo(slideIndex)}
                />
              ))}
            </div>
            <button
              type="button"
              className="lp-grow__arrow"
              aria-label="Fonctionnalité suivante"
              onClick={() => step(1)}
            >
              <ChevronRight aria-hidden strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
