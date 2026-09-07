"use client";

import type { ReactNode } from "react";
import toast, { Toaster, resolveValue, type Toast } from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader,
  X,
} from "@/lib/icons";
import { cn } from "@/components/ui";

type ToastTone = "success" | "error" | "warning" | "info" | "loading";

function toastTone(t: Toast): ToastTone {
  if (t.type === "success") return "success";
  if (t.type === "error") return "error";
  if (t.type === "loading") return "loading";
  if (t.className?.includes("obillz-toast-warning")) return "warning";
  return "info";
}

function ToastGlyph({ tone }: { tone: ToastTone }) {
  const wrap = (className: string, icon: ReactNode) => (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1",
        className
      )}
    >
      {icon}
    </div>
  );

  if (tone === "success") {
    return wrap(
      "bg-[rgba(26,35,255,0.1)] text-[#1A23FF] ring-[rgba(26,35,255,0.14)]",
      <CheckCircle className="h-5 w-5" />
    );
  }
  if (tone === "error") {
    return wrap(
      "bg-rose-50 text-rose-600 ring-rose-100",
      <AlertCircle className="h-5 w-5" />
    );
  }
  if (tone === "warning") {
    return wrap(
      "bg-amber-50 text-amber-700 ring-amber-100",
      <AlertTriangle className="h-5 w-5" />
    );
  }
  if (tone === "loading") {
    return wrap(
      "bg-[#F8FAFC] text-[#1A23FF] ring-[rgba(15,23,42,0.08)]",
      <Loader className="h-5 w-5 animate-spin" />
    );
  }
  return wrap(
    "bg-[rgba(26,35,255,0.08)] text-[#1A23FF] ring-[rgba(26,35,255,0.12)]",
    <Info className="h-5 w-5" />
  );
}

function ObillzToastItem({ t }: { t: Toast }) {
  const tone = toastTone(t);
  const message = resolveValue(t.message, t);

  return (
    <div
      data-visible={t.visible ? "true" : "false"}
      className={cn(
        "obillz-toast pointer-events-auto flex w-[min(100%,380px)] items-start gap-3 rounded-[1.25rem] border bg-white/92 px-4 py-3.5 backdrop-blur-md",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.08),0_0_24px_rgba(26,35,255,0.05)]",
        tone === "success" && "border-[rgba(26,35,255,0.12)]",
        tone === "error" && "border-rose-200/70",
        tone === "warning" && "border-amber-200/80",
        tone === "info" && "border-[rgba(26,35,255,0.1)]",
        tone === "loading" && "border-[rgba(15,23,42,0.08)]",
        t.visible ? "obillz-toast--in" : "obillz-toast--out"
      )}
      {...t.ariaProps}
    >
      <ToastGlyph tone={tone} />
      <div className="min-w-0 flex-1 pt-0.5 text-sm font-medium leading-relaxed text-[#0F172A] [overflow-wrap:anywhere]">
        {message}
      </div>
      {tone !== "loading" ? (
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#475569]"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export default function ObillzToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerClassName="obillz-toaster-container"
      toastOptions={{
        duration: 4000,
        success: { duration: 3500 },
        error: { duration: 5200 },
      }}
    >
      {(t) => <ObillzToastItem t={t} />}
    </Toaster>
  );
}
