"use client";

import { useEffect } from "react";

/**
 * Landing Obillz Sport — pas de splash/loader.
 * Force l’ouverture en haut du hero (surtout Safari iOS / restauration de scroll).
 */
export default function LandingIntroExperience() {
  useEffect(() => {
    const previousRestoration =
      "scrollRestoration" in history ? history.scrollRestoration : undefined;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const raf = window.requestAnimationFrame(resetScroll);
    /* Safari iOS restaure souvent le scroll juste après le premier layout */
    const t0 = window.setTimeout(resetScroll, 0);
    const t1 = window.setTimeout(resetScroll, 50);
    const t2 = window.setTimeout(resetScroll, 150);

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        resetScroll();
      }
    };

    const onLoad = () => {
      resetScroll();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("load", onLoad);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("load", onLoad);
      if ("scrollRestoration" in history && previousRestoration !== undefined) {
        history.scrollRestoration = previousRestoration;
      }
    };
  }, []);

  return null;
}
