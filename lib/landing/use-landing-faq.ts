"use client";

import { useMemo } from "react";
import {
  Clock,
  HelpCircle,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import { TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

export type FaqGroupKey = "gettingStarted" | "subscription" | "security";

export type LandingFaqItem = {
  group: FaqGroupKey;
  groupLabel: string;
  featured?: boolean;
  question: string;
  answer: string;
  icon: LucideIcon;
};

const groupIcons: Record<FaqGroupKey, LucideIcon> = {
  gettingStarted: Users,
  subscription: Wallet,
  security: Shield,
};

const itemIcons: LucideIcon[] = [Users, Clock, Sparkles, Wallet, Users, Wallet, Wallet, Shield];

type RawFaqItem = {
  group: string;
  featured?: boolean;
  question: string;
  answer: string;
};

function withDays(text: string) {
  return text.replace(/\{days\}/g, String(TRIAL_DURATION_DAYS));
}

export function useLandingFaq(): LandingFaqItem[] {
  const { t, locale } = useI18n();

  return useMemo(() => {
    const raw = getTranslationValue(locale, "marketing.faq.items");
    const items = (Array.isArray(raw) ? raw : []) as RawFaqItem[];

    return items.map((item, index) => {
      const group = item.group as FaqGroupKey;
      return {
        group,
        groupLabel: t(`marketing.faq.groups.${group}`),
        featured: item.featured,
        question: withDays(item.question),
        answer: withDays(item.answer),
        icon: itemIcons[index] ?? groupIcons[group] ?? HelpCircle,
      };
    });
  }, [locale, t]);
}
