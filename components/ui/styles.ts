/**
 * Fond dark premium partagé (landing, dashboard, auth).
 * Base #020617 — pas de dégradé bleu vif plein écran (ancien design).
 */
const obillzAppShellBackgroundClass =
  "relative isolate min-h-[100dvh] w-full overflow-x-clip bg-[#020617] text-white bg-[radial-gradient(ellipse_120%_80%_at_50%_-15%,rgba(26,35,255,0.55),transparent_50%),radial-gradient(ellipse_70%_50%_at_0%_40%,rgba(37,99,235,0.22),transparent_48%),radial-gradient(ellipse_60%_45%_at_100%_60%,rgba(99,102,241,0.25),transparent_50%),radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(139,92,246,0.12),transparent_58%),linear-gradient(180deg,#050816_0%,#020617_50%,#020409_100%)]";

/** Fond marketing Obillz — landing dark premium */
export const obillzLandingRootClass = `obillz-landing ${obillzAppShellBackgroundClass}`;

/** Grille technique discrète — landing / dashboard dark */
export const obillzLandingGridOverlayClass =
  "pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(96,165,250,0.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.55)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_100%_80%_at_50%_30%,black,transparent)]";

/** Shell tableau de bord — même fond dark que la landing (plus de bleu #1A23FF plein écran). */
export const dashboardShellRootClass = `dashboard-shell obillz-dashboard ${obillzAppShellBackgroundClass}`;

/** @deprecated Alias — grille identique à la landing */
export const dashboardGridOverlayClass = obillzLandingGridOverlayClass;

/**
 * Surface glass dashboard — alignée landing, intégrée au fond bleu nuit.
 * Classe CSS `.dashboard-glass-card` pour pseudo-éléments (globals.css).
 */
export const dashboardGlassCardClass =
  "dashboard-glass-card relative overflow-hidden rounded-[24px] border border-blue-400/25 bg-gradient-to-br from-white/[0.12] via-[#1A23FF]/[0.08] to-[#6366f1]/[0.06] text-white shadow-[0_0_0_1px_rgba(147,197,253,0.1),0_8px_32px_rgba(0,0,0,0.45),0_0_60px_rgba(26,35,255,0.14)] backdrop-blur-xl";

/**
 * Section / tableau / liste — **une seule carte** (un radius, une bordure, pas de cadre interne).
 */
export const unifiedSectionShellClass = dashboardGlassCardClass;

/** Bandeau d'en-tête intégré dans la même carte (léger contraste, pas une 2e boîte). */
export const unifiedSectionHeaderClass =
  "border-b border-white/10 bg-gradient-to-r from-white/[0.06] via-[#1A23FF]/[0.04] to-transparent";

/** Corps de section — suite visuelle du même bloc. */
export const unifiedSectionBodyClass = "px-4 py-4 sm:px-6 sm:py-5";

/** Pied de section optionnel. */
export const unifiedSectionFooterClass =
  "border-t border-white/10 bg-gradient-to-r from-white/[0.04] via-[#1A23FF]/[0.03] to-transparent";

/** Typographie carte dashboard */
export const dashboardCardTitleClass = "text-lg font-bold tracking-tight text-white";
export const dashboardCardDescriptionClass = "mt-1 text-sm font-medium leading-relaxed text-white/65";
export const dashboardCardLabelClass = "text-sm font-semibold text-white/60";
export const dashboardCardValueClass = "text-3xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl";

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
  "flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm transition hover:border-blue-400/25 hover:bg-white/[0.08] sm:px-4";

/** @deprecated Utilisez `sectionListRowClass` pour les listes dans une section unifiée. */
export const glassNestedRowClass = sectionListRowClass;

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
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A23FF]/80 to-[#6366f1]/60 text-white shadow-[0_0_20px_rgba(26,35,255,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-blue-300/30 sm:h-10 sm:w-10";

/** Badge icône discret — en-têtes de section */
export const dashboardIconBadgeSubtleClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-blue-200/75 ring-1 ring-white/10 backdrop-blur-sm";

/** Séparateur lumineux entre sections landing */
export const landingSectionDividerClass =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent shadow-[0_0_20px_rgba(96,165,250,0.3)]";

/** Halo diffus derrière une section */
export const landingSectionGlowClass =
  "pointer-events-none absolute inset-x-[5%] top-1/2 h-[min(480px,60vh)] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.35),rgba(99,102,241,0.15)_45%,transparent_70%)] blur-3xl";

/** Carte glass — bordure bleue + glow externe visible */
export const landingGlassCardClass =
  "landing-glass-card group relative overflow-hidden rounded-2xl border border-blue-400/30 bg-gradient-to-br from-white/[0.14] via-[#1A23FF]/[0.1] to-[#6366f1]/[0.06] shadow-[0_0_0_1px_rgba(147,197,253,0.12),0_8px_32px_rgba(0,0,0,0.55),0_0_60px_rgba(26,35,255,0.22)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300/50 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.25),0_16px_48px_rgba(0,0,0,0.55),0_0_80px_rgba(26,35,255,0.38)]";

/** Carte mise en avant — glow bleu/violet fort */
export const landingFeaturedCardClass =
  "landing-glass-card landing-glass-card-featured relative overflow-hidden rounded-2xl border border-blue-300/45 bg-gradient-to-br from-[#1A23FF]/[0.28] via-white/[0.1] to-[#6366f1]/[0.12] shadow-[0_0_0_1px_rgba(147,197,253,0.2),0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(26,35,255,0.4),0_0_120px_rgba(99,102,241,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200/55 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.35),0_16px_56px_rgba(0,0,0,0.55),0_0_100px_rgba(26,35,255,0.5),0_0_140px_rgba(99,102,241,0.2)]";

/** Conteneur section large — modules, FAQ, CTA final */
export const landingSectionShellClass =
  "landing-glass-card relative overflow-hidden rounded-[1.75rem] border border-blue-400/35 bg-gradient-to-br from-[#1A23FF]/[0.22] via-white/[0.08] to-[#6366f1]/[0.1] shadow-[0_0_0_1px_rgba(147,197,253,0.15),0_12px_56px_rgba(0,0,0,0.5),0_0_100px_rgba(26,35,255,0.28)] backdrop-blur-2xl";

/** Badge icône — état repos */
export const landingIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A23FF]/50 to-[#6366f1]/30 text-blue-200 shadow-[0_0_28px_rgba(26,35,255,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-blue-300/40";

/** Badge icône — état actif */
export const landingIconBadgeActiveClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A23FF] to-[#6366f1] text-white shadow-[0_0_36px_rgba(26,35,255,0.7),inset_0_1px_0_rgba(255,255,255,0.2)]";

/** Panneau intérieur (preview, sous-bloc) */
export const landingInnerPanelClass =
  "relative overflow-hidden rounded-xl border border-blue-400/25 bg-gradient-to-br from-white/[0.14] to-[#1A23FF]/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_40px_rgba(26,35,255,0.15)] backdrop-blur-sm";

/**
 * Aperçu écran cotisation / facture — surface quasi pleine, détachée du fond dashboard.
 * Styles complémentaires dans globals.css (`.document-preview-surface`).
 */
export const documentPreviewSurfaceClass =
  "document-preview-surface rounded-2xl border border-blue-400/25 p-6";
