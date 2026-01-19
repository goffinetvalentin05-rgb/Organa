"use client";

import { useI18n } from "@/components/I18nProvider";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import type { AssistantContext } from "@/components/assistant/types";

type AssistantTriggerButtonProps = {
  context?: AssistantContext | null;
  label?: string;
  className?: string;
};

export default function AssistantTriggerButton({
  context,
  label,
  className,
}: AssistantTriggerButtonProps) {
  const { t } = useI18n();
  const { openAssistant } = useAssistant();

  return (
    <button
      onClick={() => openAssistant(context ?? null)}
      className={
        className ??
        "px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all flex items-center gap-2 border border-subtle"
      }
    >
      {label ?? t("dashboard.assistant.openButton")}
    </button>
  );
}

