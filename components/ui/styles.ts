/**
 * Fond dark premium partagé (landing, dashboard, auth).
 * Base #020617 — pas de dégradé bleu vif plein écran (ancien design).
 */
const obillzAppShellBackgroundClass =
  "relative isolate min-h-[100dvh] w-full overflow-x-clip bg-[#020617] text-white bg-[radial-gradient(ellipse_120%_80%_at_50%_-15%,rgba(26,35,255,0.55),transparent_50%),radial-gradient(ellipse_70%_50%_at_0%_40%,rgba(37,99,235,0.22),transparent_48%),radial-gradient(ellipse_60%_45%_at_100%_60%,rgba(99,102,241,0.25),transparent_50%),radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(139,92,246,0.12),transparent_58%),linear-gradient(180deg,#050816_0%,#020617_50%,#020409_100%)]";

/** Fond marketing Obillz — pages marketing (tarifs, auth) */
export const obillzLandingRootClass =
  "obillz-landing relative isolate min-h-[100dvh] w-full overflow-x-clip bg-[#020817] text-white";

/** Accueil landing — hero sombre + feuille blanche + footer (voir globals.css `.obillz-landing-home`) */
export const obillzLandingHomeClass = `${obillzLandingRootClass} obillz-landing-home`;

/** Grille discrète — dashboard uniquement (landing sans grille) */
export const dashboardGridOverlayClass =
  "pointer-events-none absolute inset-0 z-[2] [background-image:linear-gradient(rgba(90,120,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(90,120,255,0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_110%_90%_at_50%_38%,black_15%,transparent_78%)]";

/** @deprecated Landing sans grille — utiliser `dashboardGridOverlayClass` pour le dashboard */
export const obillzLandingGridOverlayClass = dashboardGridOverlayClass;

/** Shell tableau de bord — fond dark existant */
export const dashboardShellRootClass = `dashboard-shell obillz-dashboard ${obillzAppShellBackgroundClass}`;

/**
 * Surface glass dashboard — ADN landing (navy + highlight subtil), adaptée SaaS.
 * Classe CSS `.dashboard-glass-card` pour pseudo-éléments (globals.css).
 * Intentionnellement plus sobre que l’ancien glow pour réduire la sensation de densité.
 */
export const dashboardGlassCardClass =
  "dashboard-glass-card relative overflow-hidden rounded-[1.35rem] border border-white/[0.12] bg-gradient-to-b from-white/[0.08] via-white/[0.035] to-[#06122e]/35 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl";

/**
 * Section / tableau / liste — **une seule carte** (un radius, une bordure, pas de cadre interne).
 */
export const unifiedSectionShellClass = dashboardGlassCardClass;

/** Bandeau d'en-tête intégré dans la même carte (léger contraste, pas une 2e boîte). */
export const unifiedSectionHeaderClass =
  "border-b border-white/[0.07] bg-white/[0.02]";

/** Corps de section — suite visuelle du même bloc. */
export const unifiedSectionBodyClass = "px-5 py-5 sm:px-6 sm:py-6";

/** Pied de section optionnel. */
export const unifiedSectionFooterClass =
  "border-t border-white/[0.07] bg-white/[0.02]";

/** Typographie carte dashboard */
export const dashboardCardTitleClass =
  "dashboard-section-title text-base font-semibold tracking-tight text-white sm:text-lg";
export const dashboardCardDescriptionClass =
  "mt-1 text-sm font-normal leading-relaxed text-white/55";
export const dashboardCardLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45";
export const dashboardCardValueClass =
  "text-[1.75rem] font-semibold tracking-tight text-white tabular-nums sm:text-3xl";

/** Pilule de statut (header de page) — native dark, pas de fond clair legacy. */
export const dashboardStatusPillClass =
  "inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-medium text-emerald-200";

/** Tuile action rapide — plat, sans carte dans la carte. */
export const dashboardQuickActionClass =
  "group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition-all duration-200 hover:border-blue-400/30 hover:bg-white/[0.06] sm:p-5";

/** Ligne priorité / alerte — surface minimale. */
export const dashboardPriorityRowClass =
  "group flex items-start gap-4 rounded-2xl border border-transparent px-3 py-3.5 transition-colors hover:border-white/[0.08] hover:bg-white/[0.05] sm:px-4 sm:py-4";

/**
 * @deprecated Préférez `unifiedSectionShellClass`. Conservé pour imports existants.
 */
export const glassFrameClass = unifiedSectionShellClass;

/**
 * Surface glass (cartes autonomes, stats) — même langage visuel que la section unifiée.
 */
export const glassPanelClass = dashboardGlassCardClass;

export const glassCardClass = glassPanelClass;

/** Alias : en-tête de section / modal sur la même surface. */
export const glassCardHeaderClass = unifiedSectionHeaderClass;

/** Alias historique — même surface que `glassPanelClass` (éviter double carte). */
export const innerContentClass = glassPanelClass;

export const dashboardTableHeadRowClass =
  "border-b border-white/10 bg-white/[0.04] text-xs font-semibold uppercase tracking-wide text-white/55";

/** Séparateurs de lignes — discrets, sans trait blanc parasite (cotisations, factures, membres…) */
export const dashboardTableDivideClass = "dashboard-table-divide divide-y";

/** En-tête de colonnes + séparation harmonisée avec le corps du tableau */
export const dashboardDataTableClass = "dashboard-data-table w-full text-left text-sm";

/** Pied de tableau (ex. « X cotisations au total ») — fond premium sombre */
export const dashboardTableFooterClass =
  "dashboard-table-footer px-4 py-3 sm:px-6";

export const dashboardListRowClass =
  "p-5 transition-colors hover:bg-white/[0.05] md:p-6";

/**
 * Ligne / tuile cliquable à l'intérieur d'une section — discret, pas une 2e carte épaisse.
 */
export const sectionListRowClass =
  "flex rounded-xl border border-transparent bg-transparent px-3 py-3.5 transition-colors hover:bg-white/[0.05] sm:px-4";

/** @deprecated Utilisez `sectionListRowClass` pour les listes dans une section unifiée. */
export const glassNestedRowClass = sectionListRowClass;

/** Liste à séparateurs fins (activité, factures à suivre…). */
export const dashboardSoftListClass = "divide-y divide-white/[0.06]";

export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/90 shadow-sm backdrop-blur-sm transition hover:border-blue-400/30 hover:bg-white/[0.14] hover:text-white";

/** Champs texte / textarea — style sombre unifié */
export const dashboardInputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-white shadow-sm placeholder:text-white/40 backdrop-blur-sm transition focus:border-blue-400/45 focus:outline-none focus:ring-2 focus:ring-[#1A23FF]/20 disabled:cursor-not-allowed disabled:opacity-50";

export const dashboardInputSmClass =
  "w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white shadow-sm placeholder:text-white/40 backdrop-blur-sm transition focus:border-blue-400/45 focus:outline-none focus:ring-2 focus:ring-[#1A23FF]/20 disabled:cursor-not-allowed disabled:opacity-50";

/** Select natif — color-scheme dark + classe CSS pour options (globals.css) */
export const dashboardSelectClass =
  "dashboard-select w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white shadow-sm backdrop-blur-sm transition focus:border-blue-400/45 focus:outline-none focus:ring-2 focus:ring-[#1A23FF]/20 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]";

export const dashboardSelectLgClass =
  "dashboard-select w-full rounded-xl border border-white/15 bg-slate-950/60 px-4 py-2.5 text-sm text-white shadow-sm backdrop-blur-sm transition focus:border-blue-400/45 focus:outline-none focus:ring-2 focus:ring-[#1A23FF]/20 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]";

export const dashboardLabelClass = "mb-1.5 block text-sm font-medium text-white/85";

export const dashboardHintClass = "mt-1.5 text-xs leading-relaxed text-white/55";

/** Panneau / carte interne dans une section */
export const dashboardInnerPanelClass =
  "rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm";

/** Ligne toggle / option dans un formulaire */
export const dashboardToggleRowClass =
  "flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-blue-400/25 hover:bg-white/[0.08]";

/** Ligne de liste paramètres (checkbox + label) */
export const dashboardSettingsRowClass =
  "flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4";

export const dashboardCheckboxClass =
  "mt-1 h-4 w-4 shrink-0 rounded border-white/25 bg-white/[0.08] text-[#1A23FF] accent-[#1A23FF] focus:ring-[#1A23FF]/35";

/** Panneau popover / menu déroulant ancré */
export const dashboardPopoverPanelClass =
  "rounded-xl border border-white/15 bg-slate-950/95 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.55),0_0_40px_rgba(26,35,255,0.1)] backdrop-blur-xl";

/** Modale dashboard */
export const dashboardModalClass =
  "overflow-hidden rounded-2xl border border-blue-400/25 bg-gradient-to-br from-[#0a0f2e]/98 via-[#0d1238]/98 to-[#111827]/98 text-white shadow-[0_16px_48px_rgba(0,0,0,0.55),0_0_60px_rgba(26,35,255,0.15)] backdrop-blur-2xl";

/** Calendrier buvette — statuts sombres */
export const buvetteDayAvailableClass =
  "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/22";

export const buvetteDayReservedClass =
  "border-amber-400/30 bg-amber-500/15 text-amber-200 hover:bg-amber-500/22";

export const buvetteDayOccupiedClass =
  "border-red-400/30 bg-red-500/15 text-red-200 hover:bg-red-500/22";

export const buvetteDayEmptyClass = "border-transparent bg-white/[0.03]";

/** Bloc info / lien public (plannings, etc.) */
export const dashboardInfoPanelClass =
  "rounded-[24px] border border-indigo-400/25 bg-gradient-to-br from-indigo-500/15 via-[#1A23FF]/10 to-blue-500/10 backdrop-blur-sm";

/** Badge icône accent — CTA / stats importantes */
export const iconBadgeClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB]/70 to-[#1D4ED8]/45 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ring-1 ring-white/15 sm:h-10 sm:w-10";

/** Badge icône discret — en-têtes de section */
export const dashboardIconBadgeSubtleClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-blue-200/70 ring-1 ring-white/[0.08]";

/** Séparateur lumineux entre sections landing */
export const landingSectionDividerClass =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent shadow-[0_0_20px_rgba(96,165,250,0.3)]";

/** Halo diffus derrière une section */
export const landingSectionGlowClass =
  "pointer-events-none absolute inset-x-[5%] top-1/2 h-[min(480px,60vh)] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.22),rgba(56,189,248,0.1)_45%,transparent_70%)] blur-3xl";

/** Carte premium landing — référence navy + glow bas (voir globals.css `.landing-premium-card`) */
export const landingPremiumCardClass =
  "landing-premium-card group/card relative overflow-hidden rounded-[1.75rem] transition-[border-color,box-shadow,transform] duration-[550ms] ease-out hover:-translate-y-1";

/** Carte showcase modules — même DA, radius 32px */
export const landingShowcaseCardClass =
  "landing-premium-card group/card relative flex h-full flex-col overflow-hidden rounded-[2rem] transition-[border-color,box-shadow,transform] duration-[550ms] ease-out hover:-translate-y-1.5";

/** Barre / bloc compact (comment ça marche) */
export const landingPremiumCardCompactClass =
  "landing-premium-card landing-premium-card--compact group/bar relative overflow-hidden";

/** Titre & description dans les cartes */
export const landingPremiumCardTitleClass = "landing-premium-card-title font-bold tracking-tight text-[#F8FAFC]";
export const landingPremiumCardDescClass = "landing-premium-card-desc text-[13px] leading-relaxed sm:text-sm";

/** Panneau interne mockup */
export const landingPremiumInnerClass =
  "landing-premium-inner relative overflow-hidden rounded-xl backdrop-blur-sm";

/** Carte glass — alias premium */
export const landingGlassCardClass =
  "landing-glass-card group relative overflow-hidden rounded-[1.75rem] transition-all duration-300 hover:-translate-y-1";

/** Carte mise en avant */
export const landingFeaturedCardClass =
  "landing-glass-card landing-glass-card-featured relative overflow-hidden rounded-[1.75rem] transition-all duration-300 hover:-translate-y-1";

/** Conteneur section large — FAQ accordion shell */
export const landingSectionShellClass = "landing-glass-card relative overflow-hidden rounded-[1.75rem]";

/** Badge icône — état repos */
export const landingIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/16 bg-gradient-to-br from-[#2563EB]/70 to-[#1D4ED8]/50 text-white shadow-[0_0_20px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]";

/** Badge icône — état actif */
export const landingIconBadgeActiveClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_28px_rgba(56,189,248,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]";

/** Panneau intérieur (preview, sous-bloc) */
export const landingInnerPanelClass =
  "landing-premium-inner relative overflow-hidden rounded-xl p-3 backdrop-blur-sm";

/**
 * Aperçu écran cotisation / facture — surface quasi pleine, détachée du fond dashboard.
 * Styles complémentaires dans globals.css (`.document-preview-surface`).
 */
export const documentPreviewSurfaceClass =
  "document-preview-surface rounded-2xl border border-blue-400/25 p-6";
