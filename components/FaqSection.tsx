"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: "Obillz est-il adapté à tous les clubs sportifs ?",
    answer:
      "Oui. Obillz fonctionne pour tout type de club sportif : football, hockey, tennis, volleyball ou associations sportives locales.",
  },
  {
    question: "Combien de temps faut-il pour configurer le club ?",
    answer:
      "La configuration prend généralement moins de 5 minutes. Vous pouvez ajouter vos membres et créer vos premières cotisations immédiatement.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Oui. Toutes les données sont protégées et stockées de manière sécurisée.",
  },
  {
    question: "Les membres doivent-ils installer une application ?",
    answer:
      "Non. Les membres peuvent recevoir les informations, s’inscrire aux événements ou payer leurs cotisations via des liens ou QR codes.",
  },
  {
    question: "Puis-je tester Obillz gratuitement ?",
    answer:
      "Oui. Vous pouvez créer votre espace club gratuitement et tester toutes les fonctionnalités.",
  },
];

function HighlightWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#60A5FA]">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 left-0 z-0 h-[0.56em] w-full"
      >
        <path
          d="M6 35C46 22 83 18 121 21C152 23 179 28 203 34"
          stroke="#93C5FD"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.5"
        />
        <path
          d="M8 39C44 28 83 25 125 28C155 30 180 34 201 38"
          stroke="#60A5FA"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section className="mx-auto mt-20 w-full max-w-[1000px]">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] text-slate-900 md:text-[3rem]">
          Encore des <HighlightWord>questions</HighlightWord> avant de vous lancer ?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Voici les réponses aux questions les plus courantes pour vous aider à démarrer
          sereinement.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <article
              key={item.question}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-base font-semibold text-slate-900">{item.question}</span>
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-slate-200 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600">
                    {item.answer}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
