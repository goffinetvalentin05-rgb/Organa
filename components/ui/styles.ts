/**
 * Design system Obillz — glass léger sur dégradé bleu (Paramètres, cartes premium).
 * rgba blanc ~0.08–0.15, blur 12–20px, bordure blanche douce.
 */
export const glassCardClass =
  "overflow-hidden rounded-3xl border border-white/[0.22] bg-white/[0.12] shadow-md shadow-blue-950/12 backdrop-blur-[16px]";

export const glassCardHeaderClass =
  "border-b border-white/[0.15] bg-gradient-to-r from-white/[0.1] via-white/[0.05] to-transparent";

export const iconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-900/25 sm:h-11 sm:w-11";

/** Voile très léger sur le `<main>` : garde le bleu dominant, peu de « lavage » blanc. */
export const dashboardMainScrimClass =
  "pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-blue-950/20";
