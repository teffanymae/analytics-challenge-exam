import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyError } from "@/lib/errors";

interface DailyEngagement {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  total: number;
}

interface MetricSummary {
  current: number;
  previous: number;
  change: number;
}

interface EngagementResponse {
  current: DailyEngagement[];
  previous: DailyEngagement[];
  summary: {
    likes: MetricSummary;
    comments: MetricSummary;
    shares: MetricSummary;
    saves: MetricSummary;
    total: MetricSummary;
  };
}

export function useEngagement(days = 30, platform?: string) {
  return useQuery<EngagementResponse>({
    queryKey: ["engagement", days, platform],
    queryFn: async () => {
      const response = await fetch("/api/engagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          days,
          platform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || getUserFriendlyError(response));
      }

      return response.json();
    },
  });
}
