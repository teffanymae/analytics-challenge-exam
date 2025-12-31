import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";
import { validateDaysParam } from "@/lib/validation";
import { calculateEngagement, calculateChange } from "@/lib/engagement";
import dayjs from "dayjs";
import dayjsDayOfYear from "dayjs/plugin/dayOfYear";
import isLeapYear from "dayjs/plugin/isLeapYear";

dayjs.extend(dayjsDayOfYear);
dayjs.extend(isLeapYear);

export interface AnalyticsQueryParams {
  days?: number;
  userId: string;
}

export interface TopPerformingPost {
  id: string;
  caption: string;
  platform: string;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  engagement_rate: number | null;
  posted_at: string;
  thumbnail_url: string | null;
  engagement: number;
}

export interface AnalyticsSummary {
  totalEngagement: number;
  averageEngagementRate: number;
  topPerformingPost: TopPerformingPost | null;
  trendIndicator: {
    value: number;
    isPositive: boolean;
    engagementRateChange: number;
  };
  periodDays: number;
}

export async function fetchAnalyticsSummary(
  supabase: SupabaseClient,
  params: AnalyticsQueryParams
): Promise<AnalyticsSummary> {
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

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);

  const [currentResult, previousResult] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, caption, platform, likes, comments, shares, saves, engagement_rate, posted_at, thumbnail_url"
      )
      .eq("user_id", userId)
      .gte("posted_at", startDate.toISOString())
      .lte("posted_at", endDate.toISOString()),
    supabase
      .from("posts")
      .select("likes, comments, shares, saves, engagement_rate")
      .eq("user_id", userId)
      .gte("posted_at", previousStartDate.toISOString())
      .lt("posted_at", startDate.toISOString()),
  ]);

  if (currentResult.error || previousResult.error) {
    throw new Error("Unable to retrieve analytics data. Please try again.");
  }

  const currentPosts = currentResult.data || [];
  const previousPosts = previousResult.data || [];

  const totalEngagement = currentPosts.reduce(
    (sum, post) => sum + calculateEngagement(post),
    0
  );
  const previousTotalEngagement = previousPosts.reduce(
    (sum, post) => sum + calculateEngagement(post),
    0
  );

  const averageEngagementRate =
    currentPosts.length > 0
      ? currentPosts.reduce(
          (sum, post) => sum + (post.engagement_rate || 0),
          0
        ) / currentPosts.length
      : 0;

  const previousAverageEngagementRate =
    previousPosts.length > 0
      ? previousPosts.reduce(
          (sum, post) => sum + (post.engagement_rate || 0),
          0
        ) / previousPosts.length
      : 0;

  let topPerformingPost = null;
  if (currentPosts.length > 0) {
    const topPost = currentPosts.reduce((max, post) => {
      const engagement = calculateEngagement(post);
      const maxEngagement = calculateEngagement(max);
      return engagement > maxEngagement ? post : max;
    });

    const engagement = calculateEngagement(topPost);
    topPerformingPost = {
      ...topPost,
      engagement,
    };
  }

  const trendChange = calculateChange(
    totalEngagement,
    previousTotalEngagement
  );
  const engagementRateChange = calculateChange(
    averageEngagementRate,
    previousAverageEngagementRate
  );

  return {
    totalEngagement,
    averageEngagementRate: parseFloat(averageEngagementRate.toFixed(2)),
    topPerformingPost,
    trendIndicator: {
      value: parseFloat(Math.abs(trendChange).toFixed(1)),
      isPositive: trendChange >= 0,
      engagementRateChange: parseFloat(engagementRateChange.toFixed(1)),
    },
    periodDays: days,
  };
}
