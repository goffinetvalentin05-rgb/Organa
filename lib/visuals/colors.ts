const HEX = /^#([0-9A-Fa-f]{6})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value.trim());
}

export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let v = value.trim();
  if (!v) return null;
  if (v[0] !== "#") v = `#${v}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    v = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!HEX.test(v)) return null;
  return v.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHexColor(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function mixToward(
  hex: string,
  target: "#000000" | "#FFFFFF",
  amount: number
): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const t = target === "#000000" ? 0 : 255;
  const a = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    rgb.r + (t - rgb.r) * a,
    rgb.g + (t - rgb.g) * a,
    rgb.b + (t - rgb.b) * a
  );
}

export function contrastText(hex: string): "#FFFFFF" | "#0B1220" {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#FFFFFF";
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 160 ? "#0B1220" : "#FFFFFF";
}

export function deriveSecondaryFromPrimary(primary: string): string {
  return mixToward(primary, "#000000", 0.55);
}

export function deriveAccentFromPrimary(primary: string): string {
  return mixToward(primary, "#FFFFFF", 0.18);
}
