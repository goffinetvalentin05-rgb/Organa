"use client";

import { useCallback, useEffect, useState } from "react";
import LandingPreloader from "@/components/landing/LandingPreloader";

/**
 * Module-scope : évite de rejouer le loader lors d’une navigation client Next.js.
 * Se réinitialise à chaque vrai rechargement de page.
 */
let loaderShownThisDocument = false;

export default function LandingIntroExperience() {
  const [isLoading, setIsLoading] = useState(() => !loaderShownThisDocument);

  const finishLoader = useCallback(() => {
    loaderShownThisDocument = true;
    setIsLoading(false);
  }, []);

  /* Filet de sécurité si le preloader ne callback pas */
  useEffect(() => {
    if (!isLoading) return;
    const fallback = window.setTimeout(() => {
      finishLoader();
    }, 2200);
    return () => window.clearTimeout(fallback);
  }, [isLoading, finishLoader]);

  return <LandingPreloader active={isLoading} onFinished={finishLoader} />;
}
