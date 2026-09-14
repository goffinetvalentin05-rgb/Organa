import { normalizeHexColor } from "@/lib/public-page/colors";
import type {
  PublicImagePosition,
  PublicOverlayIntensity,
  PublicPageStyle,
} from "./types";

export function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function validateHexColor(value: string | null | undefined): string | null {
  const raw = trimOrNull(value ?? "");
  if (!raw) return null;
  const normalized = normalizeHexColor(raw, "");
  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return null;
  return normalized;
}

export function parsePageStyle(value: string | null | undefined): PublicPageStyle {
  if (value === "colors" || value === "banner" || value === "fullscreen") return value;
  return "colors";
}

export function parseImagePosition(value: string | null | undefined): PublicImagePosition {
  if (value === "top" || value === "center" || value === "bottom") return value;
  return "center";
}

export function parseOverlayIntensity(value: string | null | undefined): PublicOverlayIntensity {
  if (value === "light" || value === "normal" || value === "dark") return value;
  return "normal";
}
