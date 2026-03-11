"use client";

const benefits = [
  "gagnez plusieurs heures chaque semaine",
  "evitez les erreurs dans les cotisations",
  "simplifiez l'organisation du club",
  "centralisez toutes les informations",
];

export default function BenefitsSection() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1100px]" data-reveal>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-12">
        <h2 className="text-center text-4xl font-extrabold tracking-[-0.025em] text-[#0F172A] md:text-[3rem]">
          Moins d&apos;administratif. Plus de sport.
        </h2>

        <ul className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#334155]"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
