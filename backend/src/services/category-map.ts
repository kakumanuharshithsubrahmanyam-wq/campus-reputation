const REASON_MAP: Record<string, string> = {
  Attendance: "attendance",
  Participation: "participation",
  Volunteering: "volunteering",
  "Workshop Completed": "workshop",
  "Competition Winner": "competition",
};

export function mapReasonToCategorySlug(reason: string): string {
  return REASON_MAP[reason] ?? "other";
}
