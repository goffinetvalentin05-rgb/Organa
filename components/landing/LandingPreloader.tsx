"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { easePremium } from "@/components/landing/landing-motion";

const LOADER_MS = 1050;
const EXIT_MS = 420;

type LandingPreloaderProps = {
  active: boolean;
  onFinished: () => void;
};

export default function LandingPreloader({ active, onFinished }: LandingPreloaderProps) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (!active) return;
    finishedRef.current = false;
    setExiting(false);
    setProgress(0);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let raf = 0;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    const start = performance.now();
    const duration = reduceMotion ? 280 : LOADER_MS;

    const complete = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      document.body.style.overflow = previousOverflow;
      onFinishedRef.current();
    };

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }

      setExiting(true);
      exitTimer = setTimeout(complete, reduceMotion ? 120 : EXIT_MS);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (exitTimer) clearTimeout(exitTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, reduceMotion]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="obillz-preloader"
          className="landing-preloader"
          initial={{ opacity: 1 }}
          animate={{
            opacity: exiting ? 0 : 1,
            y: exiting && !reduceMotion ? -12 : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : EXIT_MS / 1000, ease: easePremium }}
          aria-busy="true"
          aria-live="polite"
          aria-label="Chargement Obillz"
        >
          <div className="landing-preloader__inner">
            <motion.div
              className="landing-preloader__logo-wrap"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: easePremium }}
            >
              <Image
                src="/logo-page-chargement.png"
                alt="Obillz"
                width={512}
                height={512}
                priority
                className="landing-preloader__logo"
                sizes="128px"
              />
            </motion.div>

            <div className="landing-preloader__bar" aria-hidden>
              <span
                className="landing-preloader__bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
