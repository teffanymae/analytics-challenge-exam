import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/lib/database.types";
import { getUserFriendlyError } from "@/lib/errors";

interface ApiResponse {
  totalEngagement: number;
  averageEngagementRate: number;
  topPerformingPost: Tables<"posts"> | null;
  trendIndicator: {
    value: number;
    isPositive: boolean;
    engagementRateChange: number;
  };
}

export interface SummaryData {
  totalEngagement: number;
  avgEngagementRate: number;
  topPost: Tables<"posts"> | null;
  trends: {
    engagementChange: number;
    engagementRateChange: number;
  };
}

export function useSummary(days = 30) {
  return useQuery<SummaryData>({
    queryKey: ["summary", days],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/summary?days=${days}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || getUserFriendlyError(response));
      }

      const data: ApiResponse = await response.json();

      return {
        totalEngagement: data.totalEngagement,
        avgEngagementRate: data.averageEngagementRate,
        topPost: data.topPerformingPost,
        trends: {
          engagementChange:
            data.trendIndicator.value *
            (data.trendIndicator.isPositive ? 1 : -1),
          engagementRateChange: data.trendIndicator.engagementRateChange,
        },
      };
    },
  });
}
