import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getUserFriendlyError } from "@/lib/utils/errors";

export interface DailyMetric {
  date: string;
  engagement: number;
  reach: number;
}

export interface DailyMetricsResponse {
  metrics: DailyMetric[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export function useDailyMetrics(days: number = 30) {
  return useQuery<DailyMetricsResponse>({
    queryKey: ["daily-metrics", days],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`/api/metrics/daily?days=${days}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || getUserFriendlyError(response));
      }

      return response.json();
    },
  });
}
