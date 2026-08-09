import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clubSettingsDraftStore,
  emptyClubSettingsDraftData,
  isMeaningfulClubSettingsDraft,
  normalizeClubSettingsDraftData,
  toClubSettingsDraftPayload,
} from "@/lib/drafts/clubSettingsDraft";
import {
  emptyEventDraftData,
  eventDraftStore,
  isMeaningfulEventDraft,
} from "@/lib/drafts/eventDraft";
import {
  emptyExpenseDraftData,
  expenseDraftStore,
  isMeaningfulExpenseDraft,
  normalizeExpenseDraftData,
} from "@/lib/drafts/expenseDraft";
import {
  emptyMemberDraftData,
  isMeaningfulMemberDraft,
  memberDraftStore,
} from "@/lib/drafts/memberDraft";
import {
  emptyMemberImportDraftData,
  isMeaningfulMemberImportDraft,
  memberImportDraftStore,
  normalizeMemberImportDraftData,
} from "@/lib/drafts/memberImportDraft";
import {
  emptyPublicPageDraftData,
  isMeaningfulPublicPageDraft,
  publicPageDraftStore,
  toPublicPageDraftPayload,
} from "@/lib/drafts/publicPageDraft";

describe("drafts métier Vague 2", () => {
  const storeMap = new Map<string, string>();

  beforeEach(() => {
    storeMap.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storeMap.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storeMap.set(key, value);
      },
      removeItem: (key: string) => {
        storeMap.delete(key);
      },
      clear: () => storeMap.clear(),
    });
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("member-import", () => {
    it("sauvegarde mapping/rows, restaure, clear on success, refuse File", () => {
      expect(isMeaningfulMemberImportDraft(emptyMemberImportDraftData())).toBe(
        false
      );
      const data = {
        step: "mapping" as const,
        loadedFileName: "membres.csv",
        headers: ["Prénom", "Nom"],
        rows: [["Ada", "Lovelace"]],
        columnMapping: { Prénom: "prenom" as const, Nom: "nom" as const },
        importRows: [],
      };
      expect(isMeaningfulMemberImportDraft(data)).toBe(true);
      memberImportDraftStore.save("club-i", data);
      expect(memberImportDraftStore.load("club-i")?.data.loadedFileName).toBe(
        "membres.csv"
      );

      // JSON avec faux File — normalize ignore, pas de crash
      const withFile = normalizeMemberImportDraftData({
        ...data,
        pieceJointe: { name: "x.csv" },
      });
      expect(withFile?.headers).toEqual(["Prénom", "Nom"]);
      expect(JSON.stringify(withFile)).not.toContain("pieceJointe");

      memberImportDraftStore.clear("club-i");
      expect(memberImportDraftStore.load("club-i")).toBeNull();
    });
  });

  describe("club-settings", () => {
    it("n’inclut jamais resendApiKey / tokens", () => {
      const payload = toClubSettingsDraftPayload({
        ...emptyClubSettingsDraftData(),
        nomEntreprise: "FC Test",
        resendApiKey: "re_secret_should_not_persist",
        resendApiKeyTouched: true,
      });
      expect(payload).not.toHaveProperty("resendApiKey");
      expect(payload).not.toHaveProperty("resendApiKeyTouched");
      expect(isMeaningfulClubSettingsDraft(payload)).toBe(true);

      clubSettingsDraftStore.save("club-s", payload);
      const raw = storeMap.get(
        clubSettingsDraftStore.storageKey("club-s")
      ) as string;
      expect(raw).not.toContain("re_secret");
      expect(raw).not.toContain("resendApiKey");

      const normalized = normalizeClubSettingsDraftData({
        ...payload,
        resendApiKey: "leaked",
      });
      expect(normalized).not.toBeNull();
      expect(JSON.stringify(normalized)).not.toContain("leaked");
    });
  });

  describe("public-page", () => {
    it("persiste form+liens, clear on success, pas de binaire", () => {
      const empty = emptyPublicPageDraftData();
      expect(isMeaningfulPublicPageDraft(empty)).toBe(false);
      const data = toPublicPageDraftPayload(
        {
          ...empty.form,
          title: "Page club",
          enabled: true,
          slug: "fc-test",
        },
        [{ title: "Insta", url: "https://ig.me/x", type: "custom", sortOrder: 0 }]
      );
      publicPageDraftStore.save("club-p", data);
      expect(publicPageDraftStore.load("club-p")?.data.form.slug).toBe("fc-test");
      publicPageDraftStore.clear("club-p");
      expect(publicPageDraftStore.load("club-p")).toBeNull();
    });
  });

  describe("event", () => {
    it("create + entity isolation A/B + club isolation + bad JSON", () => {
      expect(isMeaningfulEventDraft(emptyEventDraftData())).toBe(false);
      eventDraftStore.save("club-e", {
        ...emptyEventDraftData(),
        name: "Match",
        startDate: "2026-09-01",
      });
      eventDraftStore.save(
        "club-e",
        { ...emptyEventDraftData(), name: "Tournoi A" },
        "evt-a"
      );
      eventDraftStore.save(
        "club-e",
        { ...emptyEventDraftData(), name: "Tournoi B" },
        "evt-b"
      );

      expect(eventDraftStore.load("club-e")?.data.name).toBe("Match");
      expect(eventDraftStore.load("club-e", "evt-a")?.data.name).toBe("Tournoi A");
      expect(eventDraftStore.load("club-e", "evt-b")?.data.name).toBe("Tournoi B");
      expect(eventDraftStore.load("club-other")).toBeNull();
      expect(eventDraftStore.parse("{bad", "club-e")).toBeNull();

      // erreur API = pas de clear
      expect(eventDraftStore.load("club-e")).not.toBeNull();
      eventDraftStore.clear("club-e");
      expect(eventDraftStore.load("club-e")).toBeNull();
    });
  });

  describe("expense", () => {
    it("métadonnées seulement — File jamais persisté ; entity isolation", () => {
      expect(isMeaningfulExpenseDraft(emptyExpenseDraftData())).toBe(false);
      const data = {
        ...emptyExpenseDraftData(),
        label: "Matériel",
        amount: "120.50",
        attachmentPending: true,
      };
      expenseDraftStore.save("club-x", data);
      const loaded = expenseDraftStore.load("club-x");
      expect(loaded?.data.attachmentPending).toBe(true);
      expect(JSON.stringify(loaded)).not.toMatch(/File|Blob|pieceJointe/);

      const normalized = normalizeExpenseDraftData({
        ...data,
        pieceJointe: { name: "facture.pdf", size: 12 },
      });
      expect(normalized?.attachmentPending).toBe(true);
      expect(JSON.stringify(normalized)).not.toContain("pieceJointe");

      expenseDraftStore.save(
        "club-x",
        { ...data, label: "Edit A" },
        "exp-a"
      );
      expenseDraftStore.save(
        "club-x",
        { ...data, label: "Edit B" },
        "exp-b"
      );
      expect(expenseDraftStore.load("club-x", "exp-a")?.data.label).toBe("Edit A");
      expect(expenseDraftStore.load("club-x", "exp-b")?.data.label).toBe("Edit B");
      expenseDraftStore.clear("club-x", "exp-a");
      expect(expenseDraftStore.load("club-x", "exp-a")).toBeNull();
      expect(expenseDraftStore.load("club-x", "exp-b")).not.toBeNull();
    });
  });

  describe("member", () => {
    it("create/edit isolation + refresh restore + clear success", () => {
      expect(isMeaningfulMemberDraft(emptyMemberDraftData())).toBe(false);
      const create = {
        ...emptyMemberDraftData(),
        nom: "Nouveau",
        email: "n@test.ch",
      };
      memberDraftStore.save("club-m", create);
      expect(memberDraftStore.load("club-m")?.data.nom).toBe("Nouveau");

      memberDraftStore.save(
        "club-m",
        { ...create, nom: "Membre A" },
        "mem-a"
      );
      memberDraftStore.save(
        "club-m",
        { ...create, nom: "Membre B" },
        "mem-b"
      );
      expect(memberDraftStore.load("club-m", "mem-a")?.data.nom).toBe("Membre A");
      expect(memberDraftStore.load("club-m", "mem-b")?.data.nom).toBe("Membre B");

      memberDraftStore.clear("club-m");
      expect(memberDraftStore.load("club-m")).toBeNull();
      // edit drafts intacts
      expect(memberDraftStore.load("club-m", "mem-a")).not.toBeNull();
    });
  });
});
