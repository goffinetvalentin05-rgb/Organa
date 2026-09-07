"use client";

import { useRef, useState } from "react";
import {
  dashboardHintClass,
  dashboardLabelClass,
  dashboardSecondaryButtonClass,
} from "@/components/ui";
import { notifyError } from "@/lib/notify";
import type { VisualImageFit } from "@/lib/visuals/types";
import { DEFAULT_IMAGE_FIT } from "@/lib/visuals/types";

export default function VisualImageField({
  label,
  value,
  slot,
  onChange,
  fit,
  onFitChange,
  changeLabel,
  positionLabel,
  zoomLabel,
  removeLabel,
  uploadError,
}: {
  label: string;
  value: string | null;
  slot: string;
  onChange: (url: string | null) => void;
  fit?: VisualImageFit;
  onFitChange?: (fit: VisualImageFit) => void;
  changeLabel: string;
  positionLabel: string;
  zoomLabel: string;
  removeLabel: string;
  uploadError: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const previous = value;
    const blobUrl = URL.createObjectURL(file);
    onChange(blobUrl);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("slot", slot);
      const res = await fetch("/api/visuals/assets", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || uploadError);
      onChange(data.url as string);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      URL.revokeObjectURL(blobUrl);
      onChange(previous);
      notifyError(e instanceof Error ? e.message : uploadError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className={dashboardLabelClass}>{label}</label>
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className={fit ? "h-36 w-full object-cover" : "h-24 w-full object-contain bg-white p-3"}
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-[rgba(15,23,42,0.14)] bg-[#F8FAFC] text-sm text-[#64748B]">
          —
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={dashboardSecondaryButtonClass}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "…" : changeLabel}
        </button>
        {value ? (
          <button
            type="button"
            className={dashboardSecondaryButtonClass}
            onClick={() => {
              onChange(null);
              if (onFitChange) onFitChange({ ...DEFAULT_IMAGE_FIT });
            }}
          >
            {removeLabel}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void handleFile(file);
        }}
      />
      {fit && onFitChange && value ? (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-[#64748B]">
            {positionLabel}
            <input
              type="range"
              min={0}
              max={100}
              value={fit.objectPositionY}
              onChange={(e) =>
                onFitChange({ ...fit, objectPositionY: Number(e.target.value) })
              }
              className="mt-1.5 w-full accent-[#1A23FF]"
            />
          </label>
          <label className="block text-xs font-medium text-[#64748B]">
            {zoomLabel}
            <input
              type="range"
              min={100}
              max={145}
              value={Math.round(fit.scale * 100)}
              onChange={(e) =>
                onFitChange({ ...fit, scale: Number(e.target.value) / 100 })
              }
              className="mt-1.5 w-full accent-[#1A23FF]"
            />
          </label>
          <p className={dashboardHintClass}>1.00× – 1.45×</p>
        </div>
      ) : null}
    </div>
  );
}
