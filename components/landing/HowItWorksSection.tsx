"use client";

import HowItWorksShowcase from "@/components/landing/HowItWorksShowcase";
import type { MockLabels } from "@/components/landing/HowItWorksMocks";
import LandingSectionIntro from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";

type Step = { title: string; description: string };

export default function HowItWorksSection() {
  const { t, locale } = useI18n();
  const raw = getTranslationValue(locale, "marketing.howItWorks.steps");
  const steps = (Array.isArray(raw) ? raw : []) as Step[];

  const mockLabels: MockLabels = {
    step1: {
      title: t("marketing.howItWorks.mocks.step1.title"),
      clubName: t("marketing.howItWorks.mocks.step1.clubName"),
      clubNameValue: t("marketing.howItWorks.mocks.step1.clubNameValue"),
      sport: t("marketing.howItWorks.mocks.step1.sport"),
      sportValue: t("marketing.howItWorks.mocks.step1.sportValue"),
      location: t("marketing.howItWorks.mocks.step1.location"),
      locationValue: t("marketing.howItWorks.mocks.step1.locationValue"),
      logo: t("marketing.howItWorks.mocks.step1.logo"),
      cta: t("marketing.howItWorks.mocks.step1.cta"),
    },
    step2: {
      title: t("marketing.howItWorks.mocks.step2.title"),
      fileName: t("marketing.howItWorks.mocks.step2.fileName"),
      uploadHint: t("marketing.howItWorks.mocks.step2.uploadHint"),
      importing: t("marketing.howItWorks.mocks.step2.importing"),
      success: t("marketing.howItWorks.mocks.step2.success"),
    },
    step3: {
      title: t("marketing.howItWorks.mocks.step3.title"),
      president: t("marketing.howItWorks.mocks.step3.president"),
      treasurer: t("marketing.howItWorks.mocks.step3.treasurer"),
      secretary: t("marketing.howItWorks.mocks.step3.secretary"),
      fullAccess: t("marketing.howItWorks.mocks.step3.fullAccess"),
      financeAccess: t("marketing.howItWorks.mocks.step3.financeAccess"),
      adminAccess: t("marketing.howItWorks.mocks.step3.adminAccess"),
    },
    step4: {
      title: t("marketing.howItWorks.mocks.step4.title"),
      members: t("marketing.howItWorks.mocks.step4.members"),
      membersCount: t("marketing.howItWorks.mocks.step4.membersCount"),
      cotisations: t("marketing.howItWorks.mocks.step4.cotisations"),
      cotisationsStatus: t("marketing.howItWorks.mocks.step4.cotisationsStatus"),
      documents: t("marketing.howItWorks.mocks.step4.documents"),
      documentsCount: t("marketing.howItWorks.mocks.step4.documentsCount"),
      events: t("marketing.howItWorks.mocks.step4.events"),
      eventsCount: t("marketing.howItWorks.mocks.step4.eventsCount"),
      centralized: t("marketing.howItWorks.mocks.step4.centralized"),
    },
  };

  return (
    <section id="comment-ca-marche" className="discovery-chapter__block scroll-mt-32 md:scroll-mt-36">
      <HowItWorksShowcase
        intro={
          <LandingSectionIntro
            layout="stack"
            label={t("marketing.howItWorks.label")}
            title={t("marketing.howItWorks.title")}
            description={t("marketing.howItWorks.subtitle")}
            className="max-w-2xl lg:max-w-[44rem]"
          />
        }
        steps={steps}
        mockLabels={mockLabels}
      />
    </section>
  );
}
