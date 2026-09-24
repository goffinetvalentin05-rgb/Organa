"use client";

import type { ReactNode } from "react";

export default function AccountingModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0" aria-label="Fermer" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
          <button type="button" className="text-sm text-[#64748B]" onClick={onClose}>Fermer</button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}
