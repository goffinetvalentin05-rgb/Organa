/**
 * Fond marketing Obillz — identique à `LandingPage` (`<main>`).
 */
export const obillzLandingRootClass =
  "relative min-h-screen bg-[var(--obillz-hero-blue)] text-white";

/** Grille 32px / opacité 10% — identique à la landing. */
export const obillzLandingGridOverlayClass =
  "pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]";

/**
 * Shell dashboard — **même fond et même grille que la landing** (pas d’arrière-plan séparé).
 */
export const dashboardShellRootClass = obillzLandingRootClass;

export const dashboardGridOverlayClass = obillzLandingGridOverlayClass;

/**
 * Cadre extérieur (double couche) — léger voile sur le dégradé de page.
 */
export const glassFrameClass =
  "overflow-hidden rounded-[24px] border border-white/35 bg-gradient-to-br from-white/[0.13] via-indigo-900/20 to-indigo-950/35 p-2 shadow-xl shadow-blue-950/20 backdrop-blur-xl";

/**
 * Surface principale — glass clair (sections, cartes, tableaux).
 */
export const glassPanelClass =
  "rounded-[20px] border border-white/45 bg-gradient-to-br from-white/95 via-sky-50/80 to-indigo-200/45 text-slate-900 shadow-lg shadow-blue-950/10 backdrop-blur-xl";

/** Carte / conteneur glass une seule couche (alias historique `glassCardClass`). */
export const glassCardClass = `${glassPanelClass} overflow-hidden`;

/** En-tête de carte / section sur panneau clair. */
export const glassCardHeaderClass =
  "border-b border-slate-200/60 bg-gradient-to-r from-white/80 via-blue-50/50 to-indigo-50/40";

/** Contenu interne (legacy TableCard / SectionCard) — identique au panneau glass. */
export const innerContentClass = glassPanelClass;

/** En-tête de tableau sur panneau clair. */
export const dashboardTableHeadRowClass =
  "border-b border-slate-200/80 bg-slate-900/[0.04] text-xs font-semibold uppercase tracking-wide text-slate-600";

/** Ligne de liste dans un conteneur `divide-y`. */
export const dashboardListRowClass =
  "p-5 transition-colors hover:bg-indigo-500/[0.06] md:p-6";

/** Rangée « accordéon » / tuile à l’intérieur d’une section glass. */
export const glassNestedRowClass =
  "rounded-2xl border border-white/55 bg-gradient-to-br from-white/90 to-indigo-50/50 px-4 py-4 shadow-sm transition hover:border-blue-200/80 hover:shadow-md sm:px-5";

/** Bouton secondaire sur fond dégradé (toolbar). */
export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25";

export const iconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-900/30 sm:h-11 sm:w-11";
