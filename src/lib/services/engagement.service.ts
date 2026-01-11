import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/utils/errors";
import { isValidPlatform, validateDaysParam } from "@/lib/utils/validation";
import { aggregateByDate, fillMissingDates, calculateTotals } from "@/lib/aggregation";
import { calculateChange } from "@/lib/utils/engagement";
import { getMaxDaysForYear, calculateComparisonPeriods } from "@/lib/utils/date-range";
import type { DailyEngagement } from "@/lib/aggregation";

export interface EngagementQueryParams {
  days?: number;
  platform?: string;
  userId: string;
  accessibleUserIds?: string[];
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
  const { days = 30, platform, userId, accessibleUserIds } = params;
  const maxDays = getMaxDaysForYear();

  const daysValidation = validateDaysParam(days, maxDays);
  if (!daysValidation.valid) {
    throw new ValidationError("Invalid days parameter", daysValidation.error);
  }

  if (platform && !isValidPlatform(platform)) {
    throw new ValidationError(
      "Invalid platform",
      "Invalid platform. Must be 'instagram' or 'tiktok'."
    );
  }

  const { current, previous } = calculateComparisonPeriods(days);
  const { startDate: currentStartDate, endDate: currentEndDate } = current;
  const { startDate: previousStartDate, endDate: previousEndDate } = previous;

  const userIds = accessibleUserIds && accessibleUserIds.length > 0 ? accessibleUserIds : [userId];

  const buildCurrentQuery = () => {
    let query = supabase
      .from("posts")
      .select("posted_at, likes, comments, shares, saves")
      .in("user_id", userIds)
      .gte("posted_at", currentStartDate.toISOString())
      .lte("posted_at", currentEndDate.toISOString());
    
    if (platform) {
      query = query.eq("platform", platform.toLowerCase());
    }
    
    return query;
  };

  const buildPreviousQuery = () => {
    let query = supabase
      .from("posts")
      .select("posted_at, likes, comments, shares, saves")
      .in("user_id", userIds)
      .gte("posted_at", previousStartDate.toISOString())
      .lte("posted_at", previousEndDate.toISOString());
    
    if (platform) {
      query = query.eq("platform", platform.toLowerCase());
    }
    
    return query;
  };

  const [currentResult, previousResult] = await Promise.all([
    buildCurrentQuery(),
    buildPreviousQuery(),
  ]);

  if (currentResult.error || previousResult.error) {
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
