import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { fetchPostById } from "@/lib/services/posts.service";
import { getAccessibleUserIds } from "@/lib/services/team.service";
import { handleError, successResponse } from "@/lib/utils/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await authenticateUser();
    const { id } = await params;

    const accessibleUserIds = await getAccessibleUserIds(supabase, user.id);

    const result = await fetchPostById(supabase, id, user.id, accessibleUserIds);

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
