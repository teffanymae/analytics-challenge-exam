import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";
import { validateDaysParam } from "@/lib/validation";
import dayjs from "dayjs";
import dayjsDayOfYear from "dayjs/plugin/dayOfYear";
import isLeapYear from "dayjs/plugin/isLeapYear";

dayjs.extend(dayjsDayOfYear);
dayjs.extend(isLeapYear);

export interface MetricsQueryParams {
  days?: number;
  userId: string;
}

export interface DailyMetric {
  date: string;
  engagement: number;
  reach: number;
}

export interface MetricsResponse {
  metrics: DailyMetric[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

const formatDate = (date: Date) => date.toISOString().split("T")[0];

export async function fetchDailyMetrics(
  supabase: SupabaseClient,
  params: MetricsQueryParams
): Promise<MetricsResponse> {
  const { days = 30, userId } = params;
  const maxDays = dayjs().isLeapYear() ? 366 : 365;

  const daysValidation = validateDaysParam(days, maxDays);
  if (!daysValidation.valid) {
    throw new ValidationError("Invalid days parameter", daysValidation.error);
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

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

  const metrics = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = formatDate(current);
    metrics.push(
      metricsMap.get(dateStr) || { date: dateStr, engagement: 0, reach: 0 }
    );
    current.setDate(current.getDate() + 1);
  }

  return {
    metrics,
    period: { start: formatDate(startDate), end: formatDate(endDate), days },
  };
}
