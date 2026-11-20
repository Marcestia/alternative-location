import {
  ALL_TIME,
  validCalendarDate,
  type AnalyticsPeriod,
} from "@/lib/analytics";
import { PERIOD_LABELS } from "@/lib/indicator-config";

export function readAnalyticsPeriod(params?: {
  period?: string;
  from?: string;
  to?: string;
}): { period: AnalyticsPeriod; error?: string } {
  const preset = params?.period ?? "all";
  if (!Object.hasOwn(PERIOD_LABELS, preset))
    return {
      period: ALL_TIME,
      error: "Période invalide. Tout l’historique est affiché.",
    };
  const from = preset === "custom" ? (params?.from ?? "") : "",
    to = preset === "custom" ? (params?.to ?? "") : "";
  if (
    preset === "custom" &&
    ((!from && !to) ||
      (from && !validCalendarDate(from)) ||
      (to && !validCalendarDate(to)) ||
      (from && to && from > to))
  )
    return {
      period: ALL_TIME,
      error: "Dates invalides. Tout l’historique est affiché.",
    };
  return { period: { preset: preset as AnalyticsPeriod["preset"], from, to } };
}
