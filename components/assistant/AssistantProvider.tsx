"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import type { AssistantContext as AssistantContextType } from "@/components/assistant/types";

type AssistantContextValue = {
  isOpen: boolean;
  context: AssistantContextType | null;
  openAssistant: (context?: AssistantContextType | null) => void;
  closeAssistant: () => void;
};

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<AssistantContextType | null>(null);

  const openAssistant = useCallback((nextContext?: AssistantContextType | null) => {
    if (typeof nextContext !== "undefined") {
      setContext(nextContext);
    }
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      context,
      openAssistant,
      closeAssistant,
    }),
    [isOpen, context, openAssistant, closeAssistant]
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantPanel isOpen={isOpen} context={context} onClose={closeAssistant} />
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}

