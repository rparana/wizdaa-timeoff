export type TimeOffStatus = "PENDING" | "APPROVED" | "REJECTED";

export function isTimeOffStatus(value: string): value is TimeOffStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}
