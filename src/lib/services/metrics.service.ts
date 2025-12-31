import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/utils/errors";
import { validateDaysParam } from "@/lib/utils/validation";
import { getMaxDaysForYear, calculateDateRange, formatDate, fillDateGaps } from "@/lib/utils/date-range";
import type { Tables } from "@/lib/database/database.types";

export interface MetricsQueryParams {
  days?: number;
  userId: string;
}

export type DailyMetric = Pick<
  Tables<"daily_metrics">,
  "date" | "engagement" | "reach"
>;

export interface MetricsResponse {
  metrics: DailyMetric[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export async function fetchDailyMetrics(
  supabase: SupabaseClient,
  params: MetricsQueryParams
): Promise<MetricsResponse> {
  const { days = 30, userId } = params;
  const maxDays = getMaxDaysForYear();

  const daysValidation = validateDaysParam(days, maxDays);
  if (!daysValidation.valid) {
    throw new ValidationError("Invalid days parameter", daysValidation.error);
  }

  const { startDate, endDate } = calculateDateRange(days);

  const { data, error } = await supabase
    .from("daily_metrics")
    .select("date, engagement, reach")
    .eq("user_id", userId)
    .gte("date", formatDate(startDate))
    .lte("date", formatDate(endDate))
    .order("date", { ascending: true });

  if (error) {
    throw new Error("Unable to retrieve daily metrics. Please try again.");
  }

  const metricsMap = new Map(
    (data || []).map((m) => [
      m.date,
      { date: m.date, engagement: m.engagement || 0, reach: m.reach || 0 },
    ])
  );

  const metrics = fillDateGaps(
    startDate,
    endDate,
    metricsMap,
    (dateStr) => ({ date: dateStr, engagement: 0, reach: 0 })
  );

  return {
    metrics,
    period: { start: formatDate(startDate), end: formatDate(endDate), days },
  };
}
