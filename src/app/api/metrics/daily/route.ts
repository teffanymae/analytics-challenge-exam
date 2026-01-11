import { NextRequest } from "next/server";
import { getAccessibleUserIds } from "@/lib/services/team.service";

export const runtime = "edge";
import { authenticateUser } from "@/lib/auth/auth";
import { fetchDailyMetrics } from "@/lib/services/metrics.service";
import { handleError, successResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateUser();
    const days = parseInt(request.nextUrl.searchParams.get("days") || "30", 10);

    const accessibleUserIds = await getAccessibleUserIds(supabase, user.id);

    const result = await fetchDailyMetrics(supabase, {
      days,
      userId: user.id,
      accessibleUserIds,
    });

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
