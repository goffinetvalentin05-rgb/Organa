"use client";

import Image from "next/image";

export default function SolutionSection() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1200px]" data-reveal>
      <div className="text-center">
        <h2 className="text-4xl font-extrabold tracking-[-0.025em] text-[#0F172A] md:text-[3.1rem]">
          Une seule plateforme pour gerer tout votre club.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#64748B] md:text-lg">
          Obillz centralise toute la gestion de votre club sportif dans un seul outil simple
          et moderne.
        </p>
      </div>

      <div className="relative mt-10 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_26px_70px_rgba(15,23,42,0.12)] md:p-5">
        <div className="pointer-events-none absolute inset-x-[20%] top-0 h-28 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18),rgba(37,99,235,0)_72%)] blur-3xl" />
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Image
            src="/images/obillz-preview.svg"
            alt="Apercu dashboard Obillz"
            width={1600}
            height={900}
            className="h-auto w-full"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
