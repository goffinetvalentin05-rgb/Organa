export type ConnectRequirements = {
  currentlyDue: string[];
  pastDue: string[];
  eventuallyDue: string[];
  disabledReason: string | null;
};

export type ConnectUiMode = "intro" | "onboarding" | "action_required" | "ready";

export function emptyConnectRequirements(): ConnectRequirements {
  return {
    currentlyDue: [],
    pastDue: [],
    eventuallyDue: [],
    disabledReason: null,
  };
}

export function deriveConnectUiMode(params: {
  hasAccount: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  currentlyDue: string[];
  pastDue: string[];
}): ConnectUiMode {
  if (!params.hasAccount) return "intro";
  if (!params.detailsSubmitted) return "onboarding";
  const due = params.currentlyDue.length > 0 || params.pastDue.length > 0;
  if (!params.chargesEnabled || due) return "action_required";
  return "ready";
}

export function isConnectActionRequired(params: {
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  pastDue: string[];
}): boolean {
  if (!params.detailsSubmitted) return true;
  if (!params.chargesEnabled) return true;
  return params.currentlyDue.length > 0 || params.pastDue.length > 0;
}
