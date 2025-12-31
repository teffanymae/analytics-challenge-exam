import { NextRequest } from "next/server";
import { authenticateUserEdge } from "@/lib/auth-edge";
import { fetchDailyMetrics } from "@/lib/services/metrics.service";
import { handleError, successResponse } from "@/lib/response";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { user, supabase } = await authenticateUserEdge(authHeader);
    const days = parseInt(request.nextUrl.searchParams.get("days") || "30", 10);

    const result = await fetchDailyMetrics(supabase, {
      days,
      userId: user.id,
    });

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
