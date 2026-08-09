import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  associationSettingsDraftStore,
  emptyAssociationSettingsDraftData,
  isMeaningfulAssociationSettingsDraft,
  normalizeAssociationSettingsDraftData,
} from "@/lib/drafts/associationSettingsDraft";
import {
  buvetteMessageDraftStore,
  emptyBuvetteMessageDraftData,
  isMeaningfulBuvetteMessageDraft,
  normalizeBuvetteMessageDraftData,
} from "@/lib/drafts/buvetteMessageDraft";
import {
  clubUserAccessDraftStore,
  emptyClubUserAccessDraftData,
  isMeaningfulClubUserAccessDraft,
  normalizeClubUserAccessDraftData,
} from "@/lib/drafts/clubUserAccessDraft";
import { clubSettingsDraftStore } from "@/lib/drafts/clubSettingsDraft";

describe("drafts métier Vague 3", () => {
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

  describe("club-user-access", () => {
    it("sauvegarde / restaure / clear on success + isolation entityId", () => {
      expect(isMeaningfulClubUserAccessDraft(emptyClubUserAccessDraftData())).toBe(
        false
      );
      const create = {
        ...emptyClubUserAccessDraftData(),
        name: "Ada",
        email: "ada@club.ch",
        functionTitle: "Trésorière",
        role: "committee" as const,
      };
      expect(isMeaningfulClubUserAccessDraft(create)).toBe(true);

      clubUserAccessDraftStore.save("club-u", create);
      expect(clubUserAccessDraftStore.load("club-u")?.data.email).toBe(
        "ada@club.ch"
      );

      clubUserAccessDraftStore.save(
        "club-u",
        { ...create, name: "Edit A" },
        "mem-a"
      );
      clubUserAccessDraftStore.save(
        "club-u",
        { ...create, name: "Edit B" },
        "mem-b"
      );
      expect(clubUserAccessDraftStore.load("club-u", "mem-a")?.data.name).toBe(
        "Edit A"
      );
      expect(clubUserAccessDraftStore.load("club-u", "mem-b")?.data.name).toBe(
        "Edit B"
      );

      clubUserAccessDraftStore.clear("club-u", "mem-a");
      expect(clubUserAccessDraftStore.load("club-u", "mem-a")).toBeNull();
      expect(clubUserAccessDraftStore.load("club-u", "mem-b")).not.toBeNull();

      clubUserAccessDraftStore.clear("club-u");
      expect(clubUserAccessDraftStore.load("club-u")).toBeNull();
    });

    it("exclut secrets / invitationUrl / password et ignore JSON invalide", () => {
      const normalized = normalizeClubUserAccessDraftData({
        name: "Bob",
        email: "bob@club.ch",
        functionTitle: "Secrétaire",
        role: "admin",
        permissions: { manage_users: true },
        password: "secret-pass",
        invitationUrl: "https://evil/invite?token=abc",
        token: "tok_xyz",
        apiKey: "key",
      });
      expect(normalized).not.toBeNull();
      expect(JSON.stringify(normalized)).not.toContain("secret-pass");
      expect(JSON.stringify(normalized)).not.toContain("invitationUrl");
      expect(JSON.stringify(normalized)).not.toContain("tok_xyz");
      expect(JSON.stringify(normalized)).not.toContain("key");

      expect(clubUserAccessDraftStore.parse("{not-json", "club-u")).toBeNull();
      expect(
        clubUserAccessDraftStore.parse(
          JSON.stringify({ version: 1, clubId: "other", data: {} }),
          "club-u"
        )
      ).toBeNull();
    });

    it("isole les clubs", () => {
      const data = {
        ...emptyClubUserAccessDraftData(),
        name: "Club A only",
      };
      clubUserAccessDraftStore.save("club-a", data);
      expect(clubUserAccessDraftStore.load("club-b")).toBeNull();
      expect(clubUserAccessDraftStore.load("club-a")?.data.name).toBe(
        "Club A only"
      );
    });
  });

  describe("association-settings", () => {
    it("product association isolé vs sport + pas de File/Blob", () => {
      expect(
        isMeaningfulAssociationSettingsDraft(emptyAssociationSettingsDraftData())
      ).toBe(false);

      const data = {
        ...emptyAssociationSettingsDraftData(),
        company_name: "Asso Test",
        description: "Longue description",
        logoPendingReselect: true,
      };
      expect(isMeaningfulAssociationSettingsDraft(data)).toBe(true);

      associationSettingsDraftStore.save("club-asso", data);
      const loaded = associationSettingsDraftStore.load("club-asso");
      expect(loaded?.data.company_name).toBe("Asso Test");
      expect(loaded?.product).toBe("association");
      expect(loaded?.data.logoPendingReselect).toBe(true);

      // Un draft sport ne doit jamais être lu comme association
      const sportKey = clubSettingsDraftStore.storageKey("club-asso");
      const assoKey = associationSettingsDraftStore.storageKey("club-asso");
      expect(sportKey).not.toBe(assoKey);
      expect(assoKey).toContain(":association:");
      expect(assoKey).not.toContain(":sport:");

      const withFileNoise = normalizeAssociationSettingsDraftData({
        ...data,
        pendingFile: { name: "logo.png", size: 12 },
        previewUrl: "blob:http://local/abc",
        password: "nope",
        token: "tok",
      });
      expect(withFileNoise?.company_name).toBe("Asso Test");
      expect(JSON.stringify(withFileNoise)).not.toContain("pendingFile");
      expect(JSON.stringify(withFileNoise)).not.toContain("blob:");
      expect(JSON.stringify(withFileNoise)).not.toContain("nope");
      expect(JSON.stringify(withFileNoise)).not.toContain("tok");

      associationSettingsDraftStore.clear("club-asso");
      expect(associationSettingsDraftStore.load("club-asso")).toBeNull();
    });

    it("JSON invalide = aucun crash", () => {
      expect(
        associationSettingsDraftStore.parse("%%%", "club-asso")
      ).toBeNull();
    });
  });

  describe("buvette-message", () => {
    it("sauvegarde message/montant, isolation entityId, clear on success", () => {
      expect(isMeaningfulBuvetteMessageDraft(emptyBuvetteMessageDraftData())).toBe(
        false
      );

      const info = {
        kind: "info" as const,
        message: "Voici les infos pratiques…",
        amount: "",
      };
      expect(isMeaningfulBuvetteMessageDraft(info)).toBe(true);

      buvetteMessageDraftStore.save("club-b", info, "req-1:info");
      expect(
        buvetteMessageDraftStore.load("club-b", "req-1:info")?.data.message
      ).toContain("infos pratiques");

      const invoice = {
        kind: "invoice" as const,
        message: "Voici ta facture",
        amount: "120.50",
      };
      buvetteMessageDraftStore.save("club-b", invoice, "req-1:invoice");
      expect(
        buvetteMessageDraftStore.load("club-b", "req-1:invoice")?.data.amount
      ).toBe("120.50");

      // Isolation info vs invoice / autre demande
      expect(buvetteMessageDraftStore.load("club-b", "req-1:info")).not.toBeNull();
      expect(buvetteMessageDraftStore.load("club-b", "req-2:info")).toBeNull();

      buvetteMessageDraftStore.clear("club-b", "req-1:info");
      expect(buvetteMessageDraftStore.load("club-b", "req-1:info")).toBeNull();
      expect(
        buvetteMessageDraftStore.load("club-b", "req-1:invoice")
      ).not.toBeNull();

      // Erreur API simulée : draft conservé tant que clear non appelé
      expect(
        buvetteMessageDraftStore.load("club-b", "req-1:invoice")?.data.message
      ).toBe("Voici ta facture");
    });

    it("n’enregistre pas destinataires / tokens et ignore JSON invalide", () => {
      const normalized = normalizeBuvetteMessageDraftData({
        kind: "invoice",
        message: "Msg",
        amount: "10",
        recipientEmail: "secret@mail.ch",
        token: "auth-token",
        password: "pwd",
      });
      expect(normalized).not.toBeNull();
      expect(JSON.stringify(normalized)).not.toContain("secret@mail.ch");
      expect(JSON.stringify(normalized)).not.toContain("auth-token");
      expect(JSON.stringify(normalized)).not.toContain("pwd");

      expect(buvetteMessageDraftStore.parse("not-json", "club-b")).toBeNull();
    });
  });

  describe("isolation product sport vs association", () => {
    it("clés et product distincts — aucune fuite croisée", () => {
      associationSettingsDraftStore.save("same-club", {
        ...emptyAssociationSettingsDraftData(),
        company_name: "Asso Only",
      });
      clubUserAccessDraftStore.save("same-club", {
        ...emptyClubUserAccessDraftData(),
        name: "Sport User",
      });

      expect(
        associationSettingsDraftStore.load("same-club")?.data.company_name
      ).toBe("Asso Only");
      expect(clubUserAccessDraftStore.load("same-club")?.data.name).toBe(
        "Sport User"
      );

      // Même clubId, produits différents → clés différentes
      expect(
        associationSettingsDraftStore.storageKey("same-club")
      ).not.toBe(clubUserAccessDraftStore.storageKey("same-club"));

      // Un envelope association ne passe pas le parse sport
      const assoRaw = storeMap.get(
        associationSettingsDraftStore.storageKey("same-club")
      )!;
      expect(
        clubUserAccessDraftStore.parse(assoRaw, "same-club")
      ).toBeNull();
    });
  });
});
