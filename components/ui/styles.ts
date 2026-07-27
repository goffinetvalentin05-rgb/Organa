/**
 * ============================================================
 * DESIGN SYSTEM — ESPACE CONNECTÉ (Obillz clair + sidebar bleue)
 * ============================================================
 * Tokens (alignés sur CSS `--dash-*`) :
 *  - primary        : #1A23FF
 *  - primary-soft   : #3B82F6
 *  - bg             : #F4F7FB
 *  - surface        : #FFFFFF
 *  - text           : #0F172A / #0B1220
 *  - text-muted     : #64748B
 *  - text-subtle    : #94A3B8
 *  - success/warn/danger : #059669 / #D97706 / #E11D48
 *  - Inputs         : fond blanc + texte foncé
 *  - Sidebar        : bleu nuit #071634 (hors tokens surface)
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

/** Shell tableau de bord — fond clair, sidebar bleue */
export const dashboardShellRootClass =
  "dashboard-shell obillz-dashboard isolate min-h-[100dvh] w-full bg-[#F4F7FB] text-[#0F172A]";

/**
 * Surface carte dashboard — blanc, bordure fine, ombre discrète.
 */
export const dashboardGlassCardClass =
  "dashboard-glass-card relative overflow-hidden rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]";

export const unifiedSectionShellClass = dashboardGlassCardClass;

export const unifiedSectionHeaderClass =
  "border-b border-[rgba(15,23,42,0.06)] bg-[#FAFBFD]";

export const unifiedSectionBodyClass = "px-5 py-5 sm:px-6 sm:py-6";

export const unifiedSectionFooterClass =
  "border-t border-[rgba(15,23,42,0.06)] bg-[#FAFBFD]";

export const dashboardCardTitleClass =
  "dashboard-section-title text-base font-semibold tracking-tight text-[#0F172A] sm:text-lg";
export const dashboardCardDescriptionClass =
  "mt-1 text-sm font-normal leading-relaxed text-[#64748B]";
export const dashboardCardLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]";
export const dashboardCardValueClass =
  "text-[1.85rem] font-semibold tracking-tight text-[#0F172A] tabular-nums sm:text-[2rem]";

export const dashboardStatusPillClass =
  "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700";

export const dashboardTextPrimaryClass = "text-[#0F172A]";
export const dashboardTextSecondaryClass = "text-[#64748B]";
export const dashboardTextMutedClass = "text-[#94A3B8]";

export const dashboardTabActiveClass =
  "border border-[rgba(26,35,255,0.2)] bg-[rgba(26,35,255,0.08)] text-[#1A23FF] shadow-sm";
export const dashboardTabInactiveClass =
  "border border-transparent text-[#64748B] hover:border-[rgba(15,23,42,0.08)] hover:bg-[#F8FAFC] hover:text-[#0F172A]";

export const dashboardTopbarControlClass =
  "dashboard-topbar-control rounded-xl";

export const dashboardQuickActionClass =
  "group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.18)] hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] sm:p-5";

export const dashboardPriorityRowClass =
  "group flex items-start gap-4 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.16)] hover:bg-white sm:px-5 sm:py-5";

export const glassFrameClass = unifiedSectionShellClass;
export const glassPanelClass = dashboardGlassCardClass;
export const glassCardClass = glassPanelClass;
export const glassCardHeaderClass = unifiedSectionHeaderClass;
export const innerContentClass = glassPanelClass;

export const dashboardTableHeadRowClass =
  "border-b border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]";

export const dashboardTableDivideClass = "dashboard-table-divide divide-y";

export const dashboardDataTableClass = "dashboard-data-table w-full text-left text-sm";

export const dashboardTableFooterClass = "dashboard-table-footer px-4 py-3 sm:px-6";

export const dashboardListRowClass =
  "p-5 transition-colors hover:bg-[#F8FAFC] md:p-6";

export const sectionListRowClass =
  "flex rounded-xl border border-transparent bg-transparent px-2 py-3.5 transition-all duration-200 hover:border-[rgba(15,23,42,0.08)] hover:bg-[#F8FAFC] sm:px-3";

export const glassNestedRowClass = sectionListRowClass;

export const dashboardSoftListClass = "divide-y divide-[rgba(15,23,42,0.06)]";

export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(15,23,42,0.1)] bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-sm transition hover:border-[rgba(26,35,255,0.22)] hover:bg-[#F8FAFC] hover:text-[#0F172A]";

/** Champs — fond clair + texte foncé pour lisibilité maximale */
export const dashboardInputClass =
  "w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 py-2.5 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-[#94A3B8] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.2)] disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#64748B] disabled:opacity-80";

export const dashboardInputSmClass =
  "w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-3 py-2 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-[#94A3B8] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.2)] disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#64748B] disabled:opacity-80";

export const dashboardSelectClass =
  "dashboard-select w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-3 py-2 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.2)] disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:opacity-80 [color-scheme:light]";

export const dashboardSelectLgClass =
  "dashboard-select w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 py-2.5 text-sm text-[#0B1220] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus:border-[#1A23FF] focus:outline-none focus:ring-2 focus:ring-[rgba(26,35,255,0.2)] disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:opacity-80 [color-scheme:light]";

export const dashboardLabelClass = "mb-1.5 block text-sm font-medium text-[#334155]";

export const dashboardHintClass = "mt-1.5 text-xs leading-relaxed text-[#64748B]";

export const dashboardInnerPanelClass =
  "rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC]";

export const dashboardToggleRowClass =
  "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3 transition-colors hover:border-[rgba(26,35,255,0.18)] hover:bg-white";

export const dashboardSettingsRowClass =
  "flex flex-col gap-2 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4";

export const dashboardCheckboxClass =
  "mt-1 h-4 w-4 shrink-0 rounded border-[#94A3B8] bg-white text-[#1A23FF] accent-[#1A23FF] focus:ring-[#1A23FF]/40";

/** Popover / modal — surface claire */
export const dashboardPopoverPanelClass =
  "rounded-2xl border border-[rgba(15,23,42,0.1)] bg-white p-4 text-[#0F172A] shadow-[0_16px_40px_rgba(15,23,42,0.12)]";

export const dashboardModalClass =
  "dashboard-modal-surface overflow-hidden rounded-[1.75rem] border border-[rgba(15,23,42,0.1)] bg-white text-[#0F172A] shadow-[0_24px_64px_rgba(15,23,42,0.14)]";

export const buvetteDayAvailableClass =
  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

export const buvetteDayReservedClass =
  "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";

export const buvetteDayOccupiedClass =
  "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";

export const buvetteDayEmptyClass = "border-transparent bg-[#F1F5F9]";

export const dashboardInfoPanelClass =
  "rounded-2xl border border-[rgba(26,35,255,0.14)] bg-[rgba(26,35,255,0.05)]";

export const iconBadgeClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(26,35,255,0.08)] text-[#1A23FF] ring-1 ring-[rgba(26,35,255,0.12)] sm:h-12 sm:w-12";

export const dashboardIconBadgeSubtleClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(26,35,255,0.08)] text-[#1A23FF] ring-1 ring-[rgba(26,35,255,0.1)]";

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
