import type { IndicatorResult } from "@/lib/indicator-engine";

export type IndicatorActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  result?: IndicatorResult;
  signature?: string;
  savedId?: string;
};
