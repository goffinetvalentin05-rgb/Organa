"use client";

import { dashboardInputClass, dashboardLabelClass } from "@/components/ui";
import { normalizeHexColor } from "@/lib/visuals/colors";

const PRESETS = [
  "#1A23FF",
  "#071634",
  "#DC2626",
  "#16A34A",
  "#F59E0B",
  "#7C3AED",
  "#0EA5E9",
  "#111827",
  "#FFFFFF",
];

export default function VisualColorField({
  label,
  value,
  onChange,
  clubColor,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  clubColor?: string | null;
}) {
  const presets = clubColor && !PRESETS.includes(clubColor)
    ? [clubColor, ...PRESETS]
    : PRESETS;

  return (
    <div>
      <label className={dashboardLabelClass}>{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={normalizeHexColor(value) ?? "#1A23FF"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-14 cursor-pointer rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-1"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          spellCheck={false}
          className={dashboardInputClass}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            const next = normalizeHexColor(e.target.value);
            if (next) onChange(next);
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onChange(color)}
            className="h-8 w-8 rounded-full border border-[rgba(15,23,42,0.12)] shadow-sm"
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  );
}
