"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_MEMBER_FIELDS,
  type MemberFieldsMerged,
} from "@/lib/member-fields/types";

const MemberFieldSettingsContext = createContext<MemberFieldsMerged | null>(null);

export function MemberFieldSettingsProvider({
  value,
  children,
}: {
  value: MemberFieldsMerged;
  children: React.ReactNode;
}) {
  return (
    <MemberFieldSettingsContext.Provider value={value}>
      {children}
    </MemberFieldSettingsContext.Provider>
  );
}

export function useMemberFieldSettings(): MemberFieldsMerged {
  const ctx = useContext(MemberFieldSettingsContext);
  return ctx ?? DEFAULT_MEMBER_FIELDS;
}
