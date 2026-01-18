"use client";

import { useI18n } from "@/components/I18nProvider";

export default function I18nText({ id }: { id: string }) {
  const { t } = useI18n();
  return t(id);
}

