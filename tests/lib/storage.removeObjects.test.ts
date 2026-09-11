import { describe, expect, it, vi } from "vitest";
import {
  isStorageObjectPath,
  removeStorageObjects,
  storagePathFromPublicUrl,
} from "@/lib/storage/removeObjects";
import { visualAssetPathsFromData } from "@/lib/visuals/assetPaths";
import type { VisualData } from "@/lib/visuals/types";

describe("storage removeObjects", () => {
  it("accepte un path club/uuid, refuse http et ..", () => {
    const club = "00000000-0000-4000-8000-0000000000a1";
    expect(isStorageObjectPath(`${club}/expense/file.pdf`)).toBe(true);
    expect(isStorageObjectPath("https://example.com/x")).toBe(false);
    expect(isStorageObjectPath(`${club}/../etc/passwd`)).toBe(false);
  });

  it("extrait un path visual-assets depuis une URL publique", () => {
    const club = "00000000-0000-4000-8000-0000000000a1";
    const url = `https://proj.supabase.co/storage/v1/object/public/visual-assets/${club}/bg.png`;
    expect(storagePathFromPublicUrl(url, "visual-assets")).toBe(`${club}/bg.png`);
    expect(storagePathFromPublicUrl(url, "Logos")).toBeNull();
  });

  it("remove ignore les chemins invalides", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const supabase = { storage: { from: () => ({ remove }) } };
    await removeStorageObjects(supabase, "expenses", [
      "https://evil",
      null,
      "00000000-0000-4000-8000-0000000000a1/ok.pdf",
    ]);
    expect(remove).toHaveBeenCalledWith([
      "00000000-0000-4000-8000-0000000000a1/ok.pdf",
    ]);
  });
});

describe("visualAssetPathsFromData", () => {
  it("ne prend que visual-assets, pas les logos club", () => {
    const club = "00000000-0000-4000-8000-0000000000a1";
    const data = {
      clubLogoUrl: `https://proj.supabase.co/storage/v1/object/public/Logos/${club}/logo.png`,
      backgroundImageUrl: `https://proj.supabase.co/storage/v1/object/public/visual-assets/${club}/bg.png`,
    } as VisualData;
    expect(visualAssetPathsFromData(data)).toEqual([`${club}/bg.png`]);
  });
});
