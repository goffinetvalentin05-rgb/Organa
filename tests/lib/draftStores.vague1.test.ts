import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emptyQuoteCreateDraftData,
  isMeaningfulQuoteCreateDraft,
  quoteCreateDraftStore,
} from "@/lib/drafts/quoteCreateDraft";
import {
  emptyInvoiceCreateDraftData,
  invoiceCreateDraftStore,
  isMeaningfulInvoiceCreateDraft,
} from "@/lib/drafts/invoiceCreateDraft";
import {
  emptyMeetingMinutesDraftData,
  isMeaningfulMeetingMinutesDraft,
  meetingMinutesDraftStore,
} from "@/lib/drafts/meetingMinutesDraft";
import {
  emptySponsorContractDraftData,
  isMeaningfulSponsorContractDraft,
  sponsorContractDraftStore,
} from "@/lib/drafts/sponsorContractDraft";
import {
  emptyMarketingCampaignDraftData,
  isMeaningfulMarketingCampaignDraft,
  marketingCampaignDraftStore,
} from "@/lib/drafts/marketingCampaignDraft";

describe("drafts métier Vague 1", () => {
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

  describe("quote-create", () => {
    it("ignore formulaire vide et restaure un devis avec lignes", () => {
      expect(isMeaningfulQuoteCreateDraft(emptyQuoteCreateDraftData())).toBe(false);
      const data = {
        ...emptyQuoteCreateDraftData(),
        notes: "Cotisation 2026",
        lignes: [
          {
            id: "1",
            designation: "Cotisation",
            quantite: 1,
            prixUnitaire: 120,
            tva: 0,
          },
        ],
      };
      expect(isMeaningfulQuoteCreateDraft(data)).toBe(true);
      quoteCreateDraftStore.save("club-q", data);
      expect(quoteCreateDraftStore.load("club-q")?.data.lignes[0]?.prixUnitaire).toBe(
        120
      );
      quoteCreateDraftStore.clear("club-q");
      expect(quoteCreateDraftStore.load("club-q")).toBeNull();
    });
  });

  describe("invoice-create", () => {
    it("persiste destinataire externe et clear on success", () => {
      expect(isMeaningfulInvoiceCreateDraft(emptyInvoiceCreateDraftData())).toBe(
        false
      );
      const data = {
        ...emptyInvoiceCreateDraftData(),
        recipientType: "external" as const,
        extName: "ACME SA",
        lignes: [
          {
            id: "1",
            designation: "Prestation",
            quantite: 2,
            prixUnitaire: 50,
            tva: 7.7,
          },
        ],
      };
      invoiceCreateDraftStore.save("club-i", data);
      expect(invoiceCreateDraftStore.load("club-i")?.data.extName).toBe("ACME SA");
      invoiceCreateDraftStore.clear("club-i");
      expect(invoiceCreateDraftStore.load("club-i")).toBeNull();
    });
  });

  describe("meeting-minutes", () => {
    it("isole entity A vs B et refuse JSON corrompu", () => {
      const dataA = {
        ...emptyMeetingMinutesDraftData(),
        title: "PV A",
        meetingDate: "2026-08-01",
      };
      const dataB = {
        ...emptyMeetingMinutesDraftData(),
        title: "PV B",
        meetingDate: "2026-08-02",
      };
      expect(isMeaningfulMeetingMinutesDraft(dataA)).toBe(true);

      meetingMinutesDraftStore.save("club-m", dataA, "pv-a");
      meetingMinutesDraftStore.save("club-m", dataB, "pv-b");

      expect(meetingMinutesDraftStore.load("club-m", "pv-a")?.data.title).toBe(
        "PV A"
      );
      expect(meetingMinutesDraftStore.load("club-m", "pv-b")?.data.title).toBe(
        "PV B"
      );
      expect(meetingMinutesDraftStore.load("club-m", "pv-c")).toBeNull();
      expect(meetingMinutesDraftStore.parse("not-json", "club-m", "pv-a")).toBeNull();
    });
  });

  describe("sponsor-contract", () => {
    it("conserve le contenu contrat après save/load", () => {
      const data = {
        ...emptySponsorContractDraftData(),
        sponsorName: "Sponsor X",
        title: "Contrat or",
        content: "Article 1 — ...",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      };
      expect(isMeaningfulSponsorContractDraft(data)).toBe(true);
      sponsorContractDraftStore.save("club-s", data, "contract-1");
      expect(
        sponsorContractDraftStore.load("club-s", "contract-1")?.data.content
      ).toContain("Article 1");
      sponsorContractDraftStore.clear("club-s", "contract-1");
      expect(sponsorContractDraftStore.load("club-s", "contract-1")).toBeNull();
    });
  });

  describe("marketing-campaign", () => {
    it("ne considère pas le HTML par défaut comme meaningful", () => {
      expect(
        isMeaningfulMarketingCampaignDraft(emptyMarketingCampaignDraftData())
      ).toBe(false);

      const data = {
        ...emptyMarketingCampaignDraftData(),
        subject: "Match samedi",
        contentHtml: "<p>Venez nombreux</p>",
      };
      marketingCampaignDraftStore.save("club-c", data);
      expect(marketingCampaignDraftStore.load("club-c")?.data.subject).toBe(
        "Match samedi"
      );
      // Erreur API : pas de clear
      expect(marketingCampaignDraftStore.load("club-c")).not.toBeNull();
      // Succès
      marketingCampaignDraftStore.clear("club-c");
      expect(marketingCampaignDraftStore.load("club-c")).toBeNull();
    });
  });
});
