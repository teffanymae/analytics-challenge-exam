"use client";

import { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react";
import { Tables } from "@/lib/database.types";
import Image from "next/image";
import { useSummary } from "@/lib/hooks/use-summary";
import { PostDetailModal } from "@/components/posts/post-detail-modal";
import { formatShortDate } from "@/lib/date";
import { calculateTotalEngagement } from "@/lib/utils";

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  days,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  days?: number;
}) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  const trendColor = isPositive
    ? "#16a34a"
    : isNegative
    ? "#dc2626"
    : "#6b7280";
  const trendBgColor = isPositive
    ? "#f0fdf4"
    : isNegative
    ? "#fef2f2"
    : "#f9fafb";

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className="flex items-center gap-1 mt-4">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ backgroundColor: trendBgColor, color: trendColor }}
          >
            {trend > 0 ? (
              <ArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
          <span className="text-xs text-gray-600 ml-1">
            vs. prior {days} days
          </span>
        </div>
      )}
    </div>
  );
}

function TopPostCard({ post }: { post: Tables<"posts"> | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!post) {
    return (
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-600">Top Performing Post</p>
        <p className="text-gray-400 mt-4">No posts available</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-gray-600">
            Top Performing Post
          </p>
          <TrendingUpIcon className="w-5 h-5 text-blue-500" />
        </div>

        <div className="flex gap-3">
          {post.thumbnail_url && (
            <Image
              src={post.thumbnail_url}
              alt="Top post"
              className="object-cover rounded"
              width={64}
              height={64}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {post.platform}
              </span>
              <span className="text-xs text-gray-500">
                {formatShortDate(post.posted_at)}
              </span>
            </div>
            {post.caption && (
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {post.caption}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span>❤️ {post.likes?.toLocaleString()}</span>
              <span>💬 {post.comments?.toLocaleString()}</span>
              <span>🔄 {post.shares?.toLocaleString()}</span>
              <span>🔖 {post.saves?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Engagement</span>
            <span className="text-lg font-bold text-gray-900">
              {calculateTotalEngagement(post).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-600">Engagement Rate</span>
            <span className="text-lg font-bold text-blue-600">
              {post.engagement_rate?.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <PostDetailModal
        postId={post.id}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

export function SummaryCards({ days }: { days: number }) {
  const { data, isLoading } = useSummary(days);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Engagement"
        value={data.totalEngagement.toLocaleString()}
        subtitle="Likes + Comments + Shares + Saves"
        trend={data.trends.engagementChange}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        }
        days={days}
      />

      <MetricCard
        title="Average Engagement Rate"
        value={`${data.avgEngagementRate.toFixed(2)}%`}
        subtitle="Across all posts"
        trend={data.trends.engagementRateChange}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
        days={days}
      />

      <TopPostCard post={data.topPost} />
    </div>
  );
}
