export const PUBLIC_PLANNING_CONFIRM_STORAGE_KEY = "obillz_public_planning_confirm_v1";

export type PublicPlanningConfirmationPayload = {
  assignmentId: string;
  planningId: string;
  eventName: string;
  slotLocation: string;
  slotDate: string;
  slotDateLabel: string;
  startTime: string;
  endTime: string;
  participantName: string;
  clubName: string;
  planningDescription?: string;
};
