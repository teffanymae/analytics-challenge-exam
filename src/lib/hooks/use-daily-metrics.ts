import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserFriendlyError } from "@/lib/utils/errors";

interface DailyMetric {
  date: string;
  engagement: number;
  reach: number;
}

interface DailyMetricsResponse {
  metrics: DailyMetric[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export function useDailyMetrics(days: number = 30) {
  const [data, setData] = useState<DailyMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

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

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unexpected error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [days]);

  return { data, isLoading, error };
}
