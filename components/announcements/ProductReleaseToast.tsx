"use client";

import { X } from "@/lib/icons";
import BodyPortal from "@/components/ui/BodyPortal";

type ProductReleaseToastProps = {
  open: boolean;
  title: string;
  message: string;
  cta: string;
  closeLabel: string;
  onCta: () => void;
  onDismiss: () => void;
};

export default function ProductReleaseToast({
  open,
  title,
  message,
  cta,
  closeLabel,
  onCta,
  onDismiss,
}: ProductReleaseToastProps) {
  return (
    <BodyPortal open={open}>
      <div className="pointer-events-auto fixed right-3 top-[4.75rem] z-[10001] w-[min(100%-1.5rem,22rem)] sm:right-5">
        <div
          role="status"
          className="rounded-[1.25rem] border border-[rgba(26,35,255,0.12)] bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#64748B]">{message}</p>
              <button
                type="button"
                onClick={onCta}
                className="mt-3 text-xs font-semibold text-[#1A23FF] transition hover:text-[#151ccc]"
              >
                {cta}
              </button>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-[#F1F5F9] hover:text-[#475569]"
              aria-label={closeLabel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
