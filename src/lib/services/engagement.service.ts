import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";
import { isValidPlatform, validateDaysParam } from "@/lib/validation";
import { aggregateByDate, fillMissingDates, calculateTotals } from "@/lib/aggregation";
import { calculateChange } from "@/lib/engagement";
import type { DailyEngagement } from "@/lib/aggregation";

export interface EngagementQueryParams {
  days?: number;
  platform?: string;
  userId: string;
}

export interface EngagementSummary {
  likes: { current: number; previous: number; change: number };
  comments: { current: number; previous: number; change: number };
  shares: { current: number; previous: number; change: number };
  saves: { current: number; previous: number; change: number };
  total: { current: number; previous: number; change: number };
}

export interface EngagementResponse {
  current: DailyEngagement[];
  previous: DailyEngagement[];
  summary: EngagementSummary;
}

export async function fetchEngagementData(
  supabase: SupabaseClient,
  params: EngagementQueryParams
): Promise<EngagementResponse> {
  const { days = 30, platform, userId } = params;

  const daysValidation = validateDaysParam(days, 365);
  if (!daysValidation.valid) {
    throw new ValidationError("Invalid days parameter", daysValidation.error);
  }

  if (platform && !isValidPlatform(platform)) {
    throw new ValidationError(
      "Invalid platform",
      "Invalid platform. Must be 'instagram' or 'tiktok'."
    );
  }

  const currentEndDate = new Date();
  const currentStartDate = new Date();
  currentStartDate.setDate(currentStartDate.getDate() - days);

  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);

  let currentQuery = supabase
    .from("posts")
    .select("posted_at, likes, comments, shares, saves")
    .eq("user_id", userId)
    .gte("posted_at", currentStartDate.toISOString())
    .lte("posted_at", currentEndDate.toISOString());

  let previousQuery = supabase
    .from("posts")
    .select("posted_at, likes, comments, shares, saves")
    .eq("user_id", userId)
    .gte("posted_at", previousStartDate.toISOString())
    .lte("posted_at", previousEndDate.toISOString());

  if (platform) {
    currentQuery = currentQuery.eq("platform", platform.toLowerCase());
    previousQuery = previousQuery.eq("platform", platform.toLowerCase());
  }

  const [currentResult, previousResult] = await Promise.all([
    currentQuery,
    previousQuery,
  ]);

  if (currentResult.error) {
    throw new Error("Unable to retrieve engagement data. Please try again.");
  }

  if (previousResult.error) {
    throw new Error("Unable to retrieve engagement data. Please try again.");
  }

  const currentMap = aggregateByDate(currentResult.data || []);
  const previousMap = aggregateByDate(previousResult.data || []);

  const currentData = fillMissingDates(
    currentStartDate,
    currentEndDate,
    currentMap
  );
  const previousData = fillMissingDates(
    previousStartDate,
    previousEndDate,
    previousMap
  );

  const currentTotals = calculateTotals(currentData);
  const previousTotals = calculateTotals(previousData);

  return {
    current: currentData,
    previous: previousData,
    summary: {
      likes: {
        current: currentTotals.likes,
        previous: previousTotals.likes,
        change: calculateChange(currentTotals.likes, previousTotals.likes),
      },
      comments: {
        current: currentTotals.comments,
        previous: previousTotals.comments,
        change: calculateChange(
          currentTotals.comments,
          previousTotals.comments
        ),
      },
      shares: {
        current: currentTotals.shares,
        previous: previousTotals.shares,
        change: calculateChange(currentTotals.shares, previousTotals.shares),
      },
      saves: {
        current: currentTotals.saves,
        previous: previousTotals.saves,
        change: calculateChange(currentTotals.saves, previousTotals.saves),
      },
      total: {
        current: currentTotals.total,
        previous: previousTotals.total,
        change: calculateChange(currentTotals.total, previousTotals.total),
      },
    },
  };
}
