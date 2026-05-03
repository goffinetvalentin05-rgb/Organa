/**
 * Design system Obillz — glass sur fond bleu (réf. Paramètres / dashboard premium).
 * Ne pas importer dans les feuilles globales : uniquement via composants.
 */
export const glassCardClass =
  "overflow-hidden rounded-3xl border border-white/30 bg-white/20 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl";

export const glassCardHeaderClass =
  "border-b border-white/[0.12] bg-gradient-to-r from-white/[0.12] via-white/[0.06] to-transparent";

export const iconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-lg shadow-blue-900/35 sm:h-11 sm:w-11";

/** Voile très léger sur le `<main>` : garde le bleu dominant, peu de « lavage » blanc. */
export const dashboardMainScrimClass =
  "pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/20";
