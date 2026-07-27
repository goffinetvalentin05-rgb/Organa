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
      className={`overflow-hidden rounded-xl border border-[rgba(15,23,42,0.08)] bg-white shadow-sm ${className}`.trim()}
    >
      <button
        id={btnId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[52px] w-full touch-manipulation items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F8FAFC] sm:min-h-[48px] sm:py-3"
      >
        <span className="text-[15px] font-semibold leading-snug text-[#0F172A] sm:text-sm">{title}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#94A3B8] transition-transform duration-200 ${
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
        className="border-t border-[rgba(15,23,42,0.06)] bg-[#FAFBFD]"
      >
        <div className="px-4 pb-4 pt-3">{children}</div>
      </div>
    </div>
  );
}
