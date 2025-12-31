export function isValidPlatform(platform: string): boolean {
  const validPlatforms = ["instagram", "tiktok"];
  return validPlatforms.includes(platform.toLowerCase());
}

export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function sanitizePageParams(
  page: number,
  pageSize: number,
  maxPageSize = 100
): { page: number; pageSize: number } {
  return {
    page: Math.max(1, Math.floor(page)),
    pageSize: Math.min(Math.max(1, Math.floor(pageSize)), maxPageSize),
  };
}

export function validateDaysParam(
  days: number,
  maxDays: number
): { valid: boolean; error?: string } {
  if (isNaN(days) || !isFinite(days)) {
    return { valid: false, error: "Days must be a valid number" };
  }
  if (days <= 0) {
    return { valid: false, error: "Days must be greater than 0" };
  }
  if (days > maxDays) {
    return {
      valid: false,
      error: `Days cannot exceed ${maxDays}`,
    };
  }
  return { valid: true };
}
