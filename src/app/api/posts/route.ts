import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { fetchPosts } from "@/lib/services/posts.service";
import { getAccessibleUserIds } from "@/lib/services/team.service";
import { handleError, successResponse } from "@/lib/utils/response";

interface PostsRequestBody {
  platform?: string;
  page?: number;
  pageSize?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateUser();
    const body: PostsRequestBody = await request.json();

    const accessibleUserIds = await getAccessibleUserIds(supabase, user.id);

    const result = await fetchPosts(supabase, {
      ...body,
      userId: user.id,
      accessibleUserIds,
    });

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
