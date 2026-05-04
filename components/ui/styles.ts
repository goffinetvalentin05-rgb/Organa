/**
 * Fond marketing Obillz — identique à `LandingPage` (`<main>`).
 */
export const obillzLandingRootClass =
  "relative min-h-screen bg-[var(--obillz-hero-blue)] text-white";

/** Grille 32px / opacité 10% — identique à la landing. */
export const obillzLandingGridOverlayClass =
  "pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]";

export const dashboardShellRootClass = obillzLandingRootClass;

export const dashboardGridOverlayClass = obillzLandingGridOverlayClass;

/**
 * Section / tableau / liste — **une seule carte** (un radius, une bordure, pas de cadre interne).
 */
export const unifiedSectionShellClass =
  "overflow-hidden rounded-[24px] border border-white/40 bg-gradient-to-br from-white/95 via-sky-50/80 to-indigo-200/45 text-slate-900 shadow-xl shadow-blue-950/10 backdrop-blur-xl";

/** Bandeau d’en-tête intégré dans la même carte (léger contraste, pas une 2e boîte). */
export const unifiedSectionHeaderClass =
  "border-b border-white/30 bg-gradient-to-r from-white/35 via-blue-50/25 to-indigo-50/20";

/** Corps de section — suite visuelle du même bloc. */
export const unifiedSectionBodyClass = "px-4 py-4 sm:px-6 sm:py-5";

/** Pied de section optionnel. */
export const unifiedSectionFooterClass =
  "border-t border-white/25 bg-gradient-to-r from-white/20 via-blue-50/15 to-transparent";

/**
 * @deprecated Préférez `unifiedSectionShellClass`. Conservé pour imports existants.
 */
export const glassFrameClass = unifiedSectionShellClass;

/**
 * Surface glass (cartes autonomes, stats) — même langage visuel que la section unifiée.
 */
export const glassPanelClass =
  "overflow-hidden rounded-[24px] border border-white/40 bg-gradient-to-br from-white/95 via-sky-50/80 to-indigo-200/45 text-slate-900 shadow-xl shadow-blue-950/10 backdrop-blur-xl";

export const glassCardClass = glassPanelClass;

/** Alias : en-tête de section / modal sur la même surface. */
export const glassCardHeaderClass = unifiedSectionHeaderClass;

/** Alias historique — même surface que `glassPanelClass` (éviter double carte). */
export const innerContentClass = glassPanelClass;

export const dashboardTableHeadRowClass =
  "border-b border-slate-200/80 bg-slate-900/[0.04] text-xs font-semibold uppercase tracking-wide text-slate-600";

export const dashboardListRowClass =
  "p-5 transition-colors hover:bg-indigo-500/[0.06] md:p-6";

/**
 * Ligne / tuile cliquable à l’intérieur d’une section — discret, pas une 2e carte épaisse.
 */
export const sectionListRowClass =
  "flex rounded-xl border border-slate-200/45 bg-white/35 px-4 py-3.5 shadow-sm backdrop-blur-sm transition hover:border-slate-300/55 hover:bg-white/50 sm:px-4";

/** @deprecated Utilisez `sectionListRowClass` pour les listes dans une section unifiée. */
export const glassNestedRowClass = sectionListRowClass;

export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25";

export const iconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-900/30 sm:h-11 sm:w-11";
