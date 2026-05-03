"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "@/lib/icons";

type SettingsAccordionProps = {
  title: string;
  /** Seul accordéon ouvert par défaut sur la page (réduit le scroll). */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export default function SettingsAccordion({
  title,
  defaultOpen = false,
  children,
  className = "",
}: SettingsAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const btnId = `${baseId}-btn`;

  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white/80 shadow-sm ${className}`.trim()}
    >
      <button
        id={btnId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[52px] touch-manipulation items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/90 sm:min-h-[48px] sm:py-3"
      >
        <span className="text-[15px] font-semibold leading-snug text-slate-800 sm:text-sm">
          {title}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        className="border-t border-slate-100"
      >
        <div className="px-4 pb-4 pt-3">{children}</div>
      </div>
    </div>
  );
}
