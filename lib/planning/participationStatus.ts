export const MEMBER_PARTICIPATION_STATUSES = [
  "registered",
  "present",
  "absent",
  "cancelled",
] as const;

export type MemberParticipationStatus = (typeof MEMBER_PARTICIPATION_STATUSES)[number];

export function participationStatusLabelFr(status: string): string {
  switch (status) {
    case "registered":
      return "Inscrit";
    case "present":
      return "Présent";
    case "absent":
      return "Absent";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}
