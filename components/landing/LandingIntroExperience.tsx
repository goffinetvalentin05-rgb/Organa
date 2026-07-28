"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LandingPreloader from "@/components/landing/LandingPreloader";

/**
 * Module-scope : évite de rejouer le loader lors d’une navigation client Next.js.
 * Se réinitialise à chaque vrai rechargement de page.
 */
let loaderShownThisDocument = false;

type LandingIntroExperienceProps = {
  /** Appelé une fois quand le préloader a terminé (immédiat si déjà joué). */
  onReady?: () => void;
};

export default function LandingIntroExperience({ onReady }: LandingIntroExperienceProps) {
  const [isLoading, setIsLoading] = useState(() => !loaderShownThisDocument);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const finishLoader = useCallback(() => {
    loaderShownThisDocument = true;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      onReadyRef.current?.();
    }
  }, [isLoading]);

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
