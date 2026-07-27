"use client";

import { useCallback, useEffect, useState } from "react";
import LandingPreloader from "@/components/landing/LandingPreloader";
import StoryInviteWidget from "@/components/landing/StoryInviteWidget";

/**
 * Module-scope : évite de rejouer le loader lors d’une navigation client Next.js.
 * Se réinitialise à chaque vrai rechargement de page.
 */
let loaderShownThisDocument = false;

const WIDGET_DELAY_MS = 850;

export default function LandingIntroExperience() {
  const [isLoading, setIsLoading] = useState(() => !loaderShownThisDocument);
  const [isStoryWidgetVisible, setIsStoryWidgetVisible] = useState(false);

  const finishLoader = useCallback(() => {
    loaderShownThisDocument = true;
    setIsLoading(false);
  }, []);

  const dismissWidget = useCallback(() => {
    setIsStoryWidgetVisible(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = window.setTimeout(() => {
      setIsStoryWidgetVisible(true);
    }, WIDGET_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  /* Filet de sécurité si le preloader ne callback pas */
  useEffect(() => {
    if (!isLoading) return;
    const fallback = window.setTimeout(() => {
      finishLoader();
    }, 2200);
    return () => window.clearTimeout(fallback);
  }, [isLoading, finishLoader]);

  return (
    <>
      <LandingPreloader active={isLoading} onFinished={finishLoader} />
      <StoryInviteWidget open={isStoryWidgetVisible} onDismiss={dismissWidget} />
    </>
  );
}
