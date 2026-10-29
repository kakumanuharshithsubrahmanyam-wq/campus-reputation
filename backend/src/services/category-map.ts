const REASON_MAP: Record<string, string> = {
  Attendance: "attendance",
  Participation: "participation",
  Volunteering: "volunteering",
  "Workshop Completed": "workshop",
  "Competition Winner": "competition",
};

export function mapReasonToCategorySlug(reason: string): string {
  if (REASON_MAP[reason]) return REASON_MAP[reason];
  for (const [prefix, slug] of Object.entries(REASON_MAP)) {
    if (reason.startsWith(prefix)) return slug;
  }
  return "other";
}
