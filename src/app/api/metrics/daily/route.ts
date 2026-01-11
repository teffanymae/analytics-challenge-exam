import { NextRequest } from "next/server";
import { authenticateUserEdge } from "@/lib/auth/auth-edge";
import { fetchDailyMetrics } from "@/lib/services/metrics.service";
import { getAccessibleUserIds } from "@/lib/services/team.service";
import { handleError, successResponse } from "@/lib/utils/response";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { user, supabase } = await authenticateUserEdge(authHeader);
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
