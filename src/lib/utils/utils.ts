import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Tables } from "@/lib/database/database.types";
import { calculateEngagement } from "@/lib/utils/engagement";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateTotalEngagement = (post: Tables<"posts">): number => {
  return calculateEngagement(post);
};
