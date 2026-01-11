import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAccessibleUserIds(
  supabase: SupabaseClient,
  currentUserId: string
): Promise<string[]> {
  const userIds = [currentUserId];

  const { data } = await supabase
    .from("team_members")
    .select("admin_user_id")
    .eq("member_user_id", currentUserId)
    .eq("status", "active");

  if (data) {
    userIds.push(...data.map((m) => m.admin_user_id));
  }

  return userIds;
}
