import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError, NotFoundError } from "@/lib/utils/errors";
import { isValidPlatform, sanitizePageParams, isValidUUID } from "@/lib/utils/validation";
import type { Tables } from "@/lib/database/database.types";

export interface PostsQueryParams {
  platform?: string;
  page?: number;
  pageSize?: number;
  userId: string;
  accessibleUserIds?: string[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export async function fetchPosts(
  supabase: SupabaseClient,
  params: PostsQueryParams
) {
  const {
    platform,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    userId,
    accessibleUserIds,
  } = params;

  if (platform && !isValidPlatform(platform)) {
    throw new ValidationError(
      "Invalid platform",
      "Invalid platform. Must be 'instagram' or 'tiktok'."
    );
  }

  const { page: validatedPage, pageSize: validatedPageSize } =
    sanitizePageParams(page, pageSize, MAX_PAGE_SIZE);

  const from = (validatedPage - 1) * validatedPageSize;
  const to = from + validatedPageSize - 1;

  const userIds = accessibleUserIds && accessibleUserIds.length > 0 ? accessibleUserIds : [userId];

  let query = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .in("user_id", userIds)
    .order("posted_at", { ascending: false })
    .range(from, to);

  if (platform) {
    query = query.eq("platform", platform.toLowerCase());
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Unable to retrieve posts. Please try again.");
  }

  const total = count || 0;
  const pagination: PaginationMeta = {
    page: validatedPage,
    pageSize: validatedPageSize,
    total,
    totalPages: Math.ceil(total / validatedPageSize),
  };

  return {
    data: (data || []) as Tables<"posts">[],
    pagination,
  };
}

export async function fetchPostById(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
  accessibleUserIds?: string[]
) {
  if (!isValidUUID(postId)) {
    throw new ValidationError(
      "Invalid post ID format",
      "Invalid post ID format."
    );
  }

  const userIds = accessibleUserIds && accessibleUserIds.length > 0 ? accessibleUserIds : [userId];

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .in("user_id", userIds)
    .single();

  if (error) {
    throw new NotFoundError("Post not found or you don't have access to it");
  }

  return data as Tables<"posts">;
}
