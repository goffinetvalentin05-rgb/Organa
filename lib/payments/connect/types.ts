import type { ClubPaymentAccount } from "@/lib/shop/types";
import type { ConnectRequirements, ConnectUiMode } from "./ui-state";

export type ClubConnectStatusDto = {
  account: ClubPaymentAccount | null;
  ready: boolean;
  incomplete: boolean;
  label: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: ConnectRequirements;
  actionRequired: boolean;
  uiMode: ConnectUiMode;
};
