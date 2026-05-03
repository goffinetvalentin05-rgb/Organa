/**
 * Fond marketing Obillz — **identique** à `components/LandingPage.tsx` (`<main>` + calque grille).
 * Ne pas diverger : une seule référence visuelle landing ↔ dashboard.
 */
export const obillzLandingRootClass =
  "relative min-h-screen bg-[var(--obillz-hero-blue)] text-white";

/** Grille 32px / opacité 10% — copie stricte de la landing. */
export const obillzLandingGridOverlayClass =
  "pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]";

/**
 * Design system Obillz — glass léger sur dégradé bleu (Paramètres, cartes premium).
 * rgba blanc ~0.08–0.15, blur 12–20px, bordure blanche douce.
 */
export const glassCardClass =
  "overflow-hidden rounded-3xl border border-white/[0.22] bg-white/[0.12] shadow-md shadow-blue-950/12 backdrop-blur-[16px]";

export const glassCardHeaderClass =
  "border-b border-white/[0.15] bg-gradient-to-r from-white/[0.1] via-white/[0.05] to-transparent";

export const iconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-900/25 sm:h-11 sm:w-11";
