"use client";

import Link from "next/link";

export default function FinalLandingCta() {
  return (
    <section id="essai" className="mx-auto mt-20 w-full max-w-[1100px] pb-10" data-reveal>
      <div className="rounded-[1.8rem] border border-blue-200/60 bg-[linear-gradient(145deg,#DBEAFE_0%,#BFDBFE_50%,#DBEAFE_100%)] p-8 text-center shadow-[0_20px_45px_rgba(37,99,235,0.14)] md:p-12">
        <h2 className="mx-auto max-w-4xl text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white md:text-5xl">
          <span className="text-[#0F172A]">
            Simplifiez la gestion de votre club dès aujourd&apos;hui.
          </span>
        </h2>

        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <Link
            href="/inscription"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.4)] transition hover:-translate-y-0.5"
          >
            Créer mon club gratuitement
          </Link>
        </div>

        <p className="mt-4 text-sm text-[#475569]">Configuration en quelques minutes • sans engagement.</p>
      </div>
    </section>
  );
}
