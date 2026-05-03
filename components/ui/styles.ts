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
 * Carte glass (conteneur principal) — aligné spec produit : rgba 0.08, blur 16px, bordure 0.15, radius 16px.
 */
export const glassCardClass =
  "overflow-hidden rounded-2xl border border-white/[0.15] bg-white/[0.08] shadow-md shadow-blue-950/15 backdrop-blur-[16px]";

export const glassCardHeaderClass =
  "border-b border-white/[0.15] bg-gradient-to-r from-white/[0.1] via-white/[0.05] to-transparent";

/**
 * Contenu interne (tableaux, formulaires, listes) — fond blanc quasi opaque + texte foncé.
 * À placer **à l’intérieur** d’un `glassCardClass`.
 */
export const innerContentClass =
  "rounded-xl border border-black/10 bg-white/90 text-slate-900 shadow-sm";

/** Bouton secondaire sur fond bleu (toolbar, annuler sur overlay). */
export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.12] px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition hover:bg-white/[0.18]";

export const iconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-900/25 sm:h-11 sm:w-11";
