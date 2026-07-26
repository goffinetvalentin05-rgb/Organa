/**
 * ============================================================
 * DESIGN SYSTEM — ESPACE CONNECTÉ (thème clair premium)
 * ============================================================
 * Palette :
 *  - Fond app        : #F6F8FC
 *  - Cartes          : #FFFFFF
 *  - Texte principal : #10172A
 *  - Texte secondaire: #667085
 *  - Texte tertiaire : #98A2B3
 *  - Bordures        : #E7EBF3
 *  - Accent          : bleu landing (#1A23FF / #2563EB)
 * La landing publique n'utilise PAS ces tokens (voir section landing en bas).
 */

/** Fond marketing Obillz — pages marketing (tarifs, auth) */
export const obillzLandingRootClass =
  "obillz-landing relative isolate min-h-[100dvh] w-full overflow-x-clip bg-[#020817] text-white";

/** Accueil landing — hero sombre + feuille blanche + footer (voir globals.css `.obillz-landing-home`) */
export const obillzLandingHomeClass = `${obillzLandingRootClass} obillz-landing-home`;

/** @deprecated Thème clair : plus de grille de fond sur le dashboard. */
export const dashboardGridOverlayClass = "hidden";

/** @deprecated Alias historique. */
export const obillzLandingGridOverlayClass = dashboardGridOverlayClass;

/** Shell tableau de bord — fond clair premium */
export const dashboardShellRootClass =
  "dashboard-shell obillz-dashboard relative isolate min-h-[100dvh] w-full overflow-x-clip bg-[#F6F8FC] text-[#10172A]";

/**
 * Surface carte dashboard — carte blanche, bordure fine, ombre douce.
 * (Le nom `dashboard-glass-card` est conservé pour la compatibilité CSS.)
 */
export const dashboardGlassCardClass =
  "dashboard-glass-card relative overflow-hidden rounded-2xl border border-[#E7EBF3] bg-white text-[#10172A] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_12px_rgba(16,24,40,0.04)]";

/**
 * Section / tableau / liste — **une seule carte** (un radius, une bordure, pas de cadre interne).
 */
export const unifiedSectionShellClass = dashboardGlassCardClass;

/** Bandeau d'en-tête intégré dans la même carte (léger contraste, pas une 2e boîte). */
export const unifiedSectionHeaderClass = "border-b border-[#EEF2F7]";

/** Corps de section — suite visuelle du même bloc. */
export const unifiedSectionBodyClass = "px-5 py-5 sm:px-6 sm:py-6";

/** Pied de section optionnel. */
export const unifiedSectionFooterClass = "border-t border-[#EEF2F7] bg-[#FAFBFD]";

/** Typographie carte dashboard */
export const dashboardCardTitleClass =
  "dashboard-section-title text-base font-semibold tracking-tight text-[#10172A] sm:text-lg";
export const dashboardCardDescriptionClass =
  "mt-1 text-sm font-normal leading-relaxed text-[#667085]";
export const dashboardCardLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]";
export const dashboardCardValueClass =
  "text-[1.75rem] font-semibold tracking-tight text-[#10172A] tabular-nums sm:text-3xl";

/** Pilule de statut (header de page). */
export const dashboardStatusPillClass =
  "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700";

/** Tuile action rapide — petite carte claire, légère. */
export const dashboardQuickActionClass =
  "group flex items-center gap-4 rounded-xl border border-[#E7EBF3] bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] sm:p-5";

/** Ligne priorité / alerte — ligne plate, séparée par un filet. */
export const dashboardPriorityRowClass =
  "group flex items-start gap-4 rounded-lg px-2 py-3.5 transition-colors hover:bg-[#F6F8FC] sm:px-3 sm:py-4";

/**
 * @deprecated Préférez `unifiedSectionShellClass`. Conservé pour imports existants.
 */
export const glassFrameClass = unifiedSectionShellClass;

/**
 * Surface carte (cartes autonomes, stats) — même langage visuel que la section unifiée.
 */
export const glassPanelClass = dashboardGlassCardClass;

export const glassCardClass = glassPanelClass;

/** Alias : en-tête de section / modal sur la même surface. */
export const glassCardHeaderClass = unifiedSectionHeaderClass;

/** Alias historique — même surface que `glassPanelClass` (éviter double carte). */
export const innerContentClass = glassPanelClass;

export const dashboardTableHeadRowClass =
  "border-b border-[#EEF2F7] bg-[#FAFBFD] text-xs font-semibold uppercase tracking-wide text-[#98A2B3]";

/** Séparateurs de lignes — discrets (cotisations, factures, membres…) */
export const dashboardTableDivideClass = "dashboard-table-divide divide-y";

/** En-tête de colonnes + séparation harmonisée avec le corps du tableau */
export const dashboardDataTableClass = "dashboard-data-table w-full text-left text-sm";

/** Pied de tableau (ex. « X cotisations au total ») */
export const dashboardTableFooterClass = "dashboard-table-footer px-4 py-3 sm:px-6";

export const dashboardListRowClass =
  "p-5 transition-colors hover:bg-[#F6F8FC] md:p-6";

/**
 * Ligne / tuile cliquable à l'intérieur d'une section — discret, pas une 2e carte épaisse.
 */
export const sectionListRowClass =
  "flex rounded-lg border border-transparent bg-transparent px-2 py-3.5 transition-colors hover:bg-[#F6F8FC] sm:px-3";

/** @deprecated Utilisez `sectionListRowClass` pour les listes dans une section unifiée. */
export const glassNestedRowClass = sectionListRowClass;

/** Liste à séparateurs fins (activité, factures à suivre…). */
export const dashboardSoftListClass = "divide-y divide-[#EEF2F7]";

export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#DDE3EE] bg-white px-4 py-2 text-sm font-medium text-[#344054] shadow-sm transition hover:border-[#C7D0E0] hover:bg-[#F6F8FC]";

/** Champs texte / textarea — style clair unifié */
export const dashboardInputClass =
  "w-full rounded-lg border border-[#DDE3EE] bg-white px-4 py-2.5 text-sm text-[#10172A] shadow-sm placeholder:text-[#98A2B3] transition focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[#F6F8FC] disabled:opacity-70";

export const dashboardInputSmClass =
  "w-full rounded-lg border border-[#DDE3EE] bg-white px-3 py-2 text-sm text-[#10172A] shadow-sm placeholder:text-[#98A2B3] transition focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[#F6F8FC] disabled:opacity-70";

/** Select natif — thème clair */
export const dashboardSelectClass =
  "dashboard-select w-full rounded-lg border border-[#DDE3EE] bg-white px-3 py-2 text-sm text-[#10172A] shadow-sm transition focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[#F6F8FC] disabled:opacity-70 [color-scheme:light]";

export const dashboardSelectLgClass =
  "dashboard-select w-full rounded-lg border border-[#DDE3EE] bg-white px-4 py-2.5 text-sm text-[#10172A] shadow-sm transition focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[#F6F8FC] disabled:opacity-70 [color-scheme:light]";

export const dashboardLabelClass = "mb-1.5 block text-sm font-medium text-[#344054]";

export const dashboardHintClass = "mt-1.5 text-xs leading-relaxed text-[#98A2B3]";

/** Panneau / carte interne dans une section */
export const dashboardInnerPanelClass =
  "rounded-xl border border-[#EEF2F7] bg-[#FAFBFD]";

/** Ligne toggle / option dans un formulaire */
export const dashboardToggleRowClass =
  "flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#E7EBF3] bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30";

/** Ligne de liste paramètres (checkbox + label) */
export const dashboardSettingsRowClass =
  "flex flex-col gap-2 rounded-xl border border-[#E7EBF3] bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4";

export const dashboardCheckboxClass =
  "mt-1 h-4 w-4 shrink-0 rounded border-[#C7D0E0] bg-white text-[#1A23FF] accent-[#1A23FF] focus:ring-[#1A23FF]/25";

/** Panneau popover / menu déroulant ancré */
export const dashboardPopoverPanelClass =
  "rounded-xl border border-[#E7EBF3] bg-white p-4 shadow-[0_12px_32px_rgba(16,24,40,0.12),0_2px_8px_rgba(16,24,40,0.06)]";

/** Modale dashboard */
export const dashboardModalClass =
  "overflow-hidden rounded-2xl border border-[#E7EBF3] bg-white text-[#10172A] shadow-[0_24px_64px_rgba(16,24,40,0.18),0_4px_16px_rgba(16,24,40,0.08)]";

/** Calendrier buvette — statuts clairs */
export const buvetteDayAvailableClass =
  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

export const buvetteDayReservedClass =
  "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";

export const buvetteDayOccupiedClass =
  "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";

export const buvetteDayEmptyClass = "border-transparent bg-[#F6F8FC]";

/** Bloc info / lien public (plannings, etc.) */
export const dashboardInfoPanelClass =
  "rounded-2xl border border-blue-100 bg-blue-50/60";

/** Badge icône accent — CTA / stats importantes */
export const iconBadgeClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100 sm:h-10 sm:w-10";

/** Badge icône discret — en-têtes de section */
export const dashboardIconBadgeSubtleClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2F5FA] text-[#667085] ring-1 ring-[#E7EBF3]";

/* ============================================================
 * LANDING — tokens réservés à la landing publique (NE PAS MODIFIER
 * pour le dashboard ; la landing garde son design existant).
 * ============================================================ */

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
 * Aperçu écran cotisation / facture — feuille document sur fond clair.
 * Styles complémentaires dans globals.css (`.document-preview-surface`).
 */
export const documentPreviewSurfaceClass =
  "document-preview-surface rounded-2xl border border-[#E7EBF3] p-6";
