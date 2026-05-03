/**
 * Design system Obillz — surfaces « glass » lisibles sur le fond dashboard bleu.
 * Ne pas importer dans les feuilles globales : uniquement via composants.
 */
export const glassCardClass =
  "overflow-hidden rounded-2xl border border-white/35 bg-white/85 shadow-lg shadow-slate-900/12 backdrop-blur-md";

export const glassCardHeaderClass =
  "border-b border-slate-100/90 bg-gradient-to-r from-blue-600/[0.1] via-white/70 to-indigo-600/[0.08]";

export const iconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-600/25 sm:h-11 sm:w-11";

/** Voile léger pour la zone `<main>` du dashboard (optionnel, layout). */
export const dashboardMainScrimClass =
  "pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-slate-950/10";
