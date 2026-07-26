/**
 * ============================================================
 * DESIGN SYSTEM — ESPACE CONNECTÉ (Obillz dark blue premium)
 * ============================================================
 * Tokens (alignés sur CSS `--dash-*`) :
 *  - primary        : #1A23FF
 *  - primary-soft   : #3B82F6
 *  - primary-glow   : #93C5FD
 *  - bg             : #071634
 *  - surface        : #0F2744
 *  - text           : #F1F5F9 / #F8FAFC
 *  - text-muted     : #A8B8D0
 *  - text-subtle    : #8BA0BC
 *  - success/warn/danger : #34D399 / #FBBF24 / #FB7185
 *  - Inputs         : fond blanc + texte foncé
 * La landing publique n'utilise PAS ces tokens.
 */

/** Fond marketing Obillz — pages marketing (tarifs, auth) */
export const obillzLandingRootClass =
  "obillz-landing relative isolate min-h-[100dvh] w-full overflow-x-clip bg-[#020817] text-white";

/** Accueil landing — hero sombre + feuille blanche + footer (voir globals.css `.obillz-landing-home`) */
export const obillzLandingHomeClass = `${obillzLandingRootClass} obillz-landing-home`;

/** @deprecated */
export const dashboardGridOverlayClass = "hidden";

/** @deprecated Alias historique. */
export const obillzLandingGridOverlayClass = dashboardGridOverlayClass;

/** Shell tableau de bord — bleu nuit Obillz */
export const dashboardShellRootClass =
  "dashboard-shell obillz-dashboard isolate min-h-[100dvh] w-full bg-[#071634] text-[#F1F5F9]";

/**
 * Surface carte dashboard — navy élevée, bordure bleue, ombre premium.
 */
export const dashboardGlassCardClass =
  "dashboard-glass-card relative overflow-hidden rounded-[1.5rem] border border-[rgba(147,197,253,0.14)] bg-[#0F2744] text-[#F1F5F9] shadow-[0_8px_32px_rgba(2,6,23,0.35)]";

export const unifiedSectionShellClass = dashboardGlassCardClass;

export const unifiedSectionHeaderClass =
  "border-b border-[rgba(147,197,253,0.12)] bg-[rgba(255,255,255,0.03)]";

export const unifiedSectionBodyClass = "px-5 py-5 sm:px-6 sm:py-6";

export const unifiedSectionFooterClass =
  "border-t border-[rgba(147,197,253,0.12)] bg-[rgba(7,22,52,0.35)]";

export const dashboardCardTitleClass =
  "dashboard-section-title text-base font-semibold tracking-tight text-[#F8FAFC] sm:text-lg";
export const dashboardCardDescriptionClass =
  "mt-1 text-sm font-normal leading-relaxed text-[#A8B8D0]";
export const dashboardCardLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8BA0BC]";
export const dashboardCardValueClass =
  "text-[1.85rem] font-semibold tracking-tight text-[#F8FAFC] tabular-nums sm:text-[2rem]";

export const dashboardStatusPillClass =
  "inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-3.5 py-1.5 text-sm font-medium text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.12)]";

export const dashboardQuickActionClass =
  "group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[rgba(147,197,253,0.14)] bg-[rgba(255,255,255,0.04)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(96,165,250,0.35)] hover:bg-[rgba(26,35,255,0.12)] hover:shadow-[0_16px_40px_rgba(2,6,23,0.35)] sm:p-5";

export const dashboardPriorityRowClass =
  "group flex items-start gap-4 rounded-2xl border border-[rgba(147,197,253,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(96,165,250,0.3)] hover:bg-[rgba(255,255,255,0.06)] sm:px-5 sm:py-5";

export const glassFrameClass = unifiedSectionShellClass;
export const glassPanelClass = dashboardGlassCardClass;
export const glassCardClass = glassPanelClass;
export const glassCardHeaderClass = unifiedSectionHeaderClass;
export const innerContentClass = glassPanelClass;

export const dashboardTableHeadRowClass =
  "border-b border-[rgba(147,197,253,0.12)] bg-[rgba(7,22,52,0.45)] text-xs font-semibold uppercase tracking-wide text-[#8BA0BC]";

export const dashboardTableDivideClass = "dashboard-table-divide divide-y";

export const dashboardDataTableClass = "dashboard-data-table w-full text-left text-sm";

export const dashboardTableFooterClass = "dashboard-table-footer px-4 py-3 sm:px-6";

export const dashboardListRowClass =
  "p-5 transition-colors hover:bg-[rgba(255,255,255,0.04)] md:p-6";

export const sectionListRowClass =
  "flex rounded-xl border border-transparent bg-transparent px-2 py-3.5 transition-all duration-200 hover:border-[rgba(147,197,253,0.12)] hover:bg-[rgba(255,255,255,0.04)] sm:px-3";

export const glassNestedRowClass = sectionListRowClass;

export const dashboardSoftListClass = "divide-y divide-[rgba(147,197,253,0.10)]";

export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(147,197,253,0.22)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm font-medium text-[#E2E8F0] shadow-sm transition hover:border-[rgba(96,165,250,0.4)] hover:bg-[rgba(255,255,255,0.1)]";

/** Champs — fond clair + texte foncé pour lisibilité maximale */
export const dashboardInputClass =
  "w-full rounded-xl border border-[rgba(147,197,253,0.28)] bg-white px-4 py-2.5 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(2,6,23,0.2)] placeholder:text-[#64748B] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.35)] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#475569] disabled:opacity-80";

export const dashboardInputSmClass =
  "w-full rounded-xl border border-[rgba(147,197,253,0.28)] bg-white px-3 py-2 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(2,6,23,0.2)] placeholder:text-[#64748B] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.35)] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#475569] disabled:opacity-80";

export const dashboardSelectClass =
  "dashboard-select w-full rounded-xl border border-[rgba(147,197,253,0.28)] bg-white px-3 py-2 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(2,6,23,0.2)] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.35)] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:opacity-80 [color-scheme:light]";

export const dashboardSelectLgClass =
  "dashboard-select w-full rounded-xl border border-[rgba(147,197,253,0.28)] bg-white px-4 py-2.5 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(2,6,23,0.2)] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.35)] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:opacity-80 [color-scheme:light]";

export const dashboardLabelClass = "mb-1.5 block text-sm font-medium text-[#E2E8F0]";

export const dashboardHintClass = "mt-1.5 text-xs leading-relaxed text-[#A8B8D0]";

export const dashboardInnerPanelClass =
  "rounded-2xl border border-[rgba(147,197,253,0.14)] bg-[rgba(7,22,52,0.55)]";

export const dashboardToggleRowClass =
  "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[rgba(147,197,253,0.16)] bg-[rgba(255,255,255,0.05)] px-4 py-3 transition-colors hover:border-[rgba(96,165,250,0.35)] hover:bg-[rgba(255,255,255,0.08)]";

export const dashboardSettingsRowClass =
  "flex flex-col gap-2 rounded-2xl border border-[rgba(147,197,253,0.16)] bg-[rgba(255,255,255,0.05)] p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4";

export const dashboardCheckboxClass =
  "mt-1 h-4 w-4 shrink-0 rounded border-[#94A3B8] bg-white text-[#1A23FF] accent-[#1A23FF] focus:ring-[#1A23FF]/40";

/** Popover / modal — surface claire contrôlée pour lisibilité des menus */
export const dashboardPopoverPanelClass =
  "rounded-2xl border border-[rgba(147,197,253,0.2)] bg-[#0F2744] p-4 text-[#F1F5F9] shadow-[0_16px_48px_rgba(2,6,23,0.45)] backdrop-blur-xl";

export const dashboardModalClass =
  "overflow-hidden rounded-[1.75rem] border border-[rgba(147,197,253,0.18)] bg-[#0F2744] text-[#F1F5F9] shadow-[0_24px_64px_rgba(2,6,23,0.5)]";

export const buvetteDayAvailableClass =
  "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25";

export const buvetteDayReservedClass =
  "border-amber-400/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25";

export const buvetteDayOccupiedClass =
  "border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25";

export const buvetteDayEmptyClass = "border-transparent bg-[rgba(255,255,255,0.04)]";

export const dashboardInfoPanelClass =
  "rounded-2xl border border-[rgba(96,165,250,0.25)] bg-[rgba(26,35,255,0.14)]";

export const iconBadgeClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A23FF]/35 to-[#38BDF8]/20 text-[#93C5FD] ring-1 ring-[rgba(147,197,253,0.25)] shadow-[0_0_20px_rgba(26,35,255,0.25)] sm:h-12 sm:w-12";

export const dashboardIconBadgeSubtleClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(26,35,255,0.22)] text-[#93C5FD] ring-1 ring-[rgba(147,197,253,0.2)]";

/* ============================================================
 * LANDING — tokens réservés à la landing publique (NE PAS MODIFIER)
 * ============================================================ */

export const landingSectionDividerClass =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent shadow-[0_0_20px_rgba(96,165,250,0.3)]";

export const landingSectionGlowClass =
  "pointer-events-none absolute inset-x-[5%] top-1/2 h-[min(480px,60vh)] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.22),rgba(56,189,248,0.1)_45%,transparent_70%)] blur-3xl";

export const landingPremiumCardClass =
  "landing-premium-card group/card relative overflow-hidden rounded-[1.75rem] transition-[border-color,box-shadow,transform] duration-[550ms] ease-out hover:-translate-y-1";

export const landingShowcaseCardClass =
  "landing-premium-card group/card relative flex h-full flex-col overflow-hidden rounded-[2rem] transition-[border-color,box-shadow,transform] duration-[550ms] ease-out hover:-translate-y-1.5";

export const landingPremiumCardCompactClass =
  "landing-premium-card landing-premium-card--compact group/bar relative overflow-hidden";

export const landingPremiumCardTitleClass = "landing-premium-card-title font-bold tracking-tight text-[#F8FAFC]";
export const landingPremiumCardDescClass = "landing-premium-card-desc text-[13px] leading-relaxed sm:text-sm";

export const landingPremiumInnerClass =
  "landing-premium-inner relative overflow-hidden rounded-xl backdrop-blur-sm";

export const landingGlassCardClass =
  "landing-glass-card group relative overflow-hidden rounded-[1.75rem] transition-all duration-300 hover:-translate-y-1";

export const landingFeaturedCardClass =
  "landing-glass-card landing-glass-card-featured relative overflow-hidden rounded-[1.75rem] transition-all duration-300 hover:-translate-y-1";

export const landingSectionShellClass = "landing-glass-card relative overflow-hidden rounded-[1.75rem]";

export const landingIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/16 bg-gradient-to-br from-[#2563EB]/70 to-[#1D4ED8]/50 text-white shadow-[0_0_20px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]";

export const landingIconBadgeActiveClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_28px_rgba(56,189,248,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]";

export const landingInnerPanelClass =
  "landing-premium-inner relative overflow-hidden rounded-xl p-3 backdrop-blur-sm";

export const documentPreviewSurfaceClass =
  "document-preview-surface rounded-2xl border border-[rgba(147,197,253,0.2)] p-6";
