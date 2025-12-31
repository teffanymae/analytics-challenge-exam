"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
  Column,
} from "@tanstack/react-table";
import { Tables } from "@/lib/database.types";
import { usePosts } from "@/lib/hooks/use-posts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PostDetailModal } from "./post-detail-modal";
import { useUIStore } from "@/lib/stores/ui-store";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatShortDate } from "@/lib/date";

const SortableHeader = ({
  column,
  children,
}: {
  column: Column<Tables<"posts">, unknown>;
  children: React.ReactNode;
}) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    className="hover:bg-gray-100"
  >
    {children}
    {column.getIsSorted() === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : column.getIsSorted() === "desc" ? (
      <ArrowDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4" />
    )}
  </Button>
);

export function PostsTable() {
  const platformFilter = useUIStore((state) => state.platformFilter);
  const setPlatformFilter = useUIStore((state) => state.setPlatformFilter);
  const selectedPostId = useUIStore((state) => state.selectedPostId);
  const isPostModalOpen = useUIStore((state) => state.isPostModalOpen);
  const openPostModal = useUIStore((state) => state.openPostModal);
  const closePostModal = useUIStore((state) => state.closePostModal);
  const pageSize = useUIStore((state) => state.pageSize);
  const setPageSize = useUIStore((state) => state.setPageSize);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when platform filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [platformFilter, pageSize]);

  const { data, isLoading, error } = usePosts(
    platformFilter,
    currentPage,
    pageSize
  );
  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const columns = useMemo<ColumnDef<Tables<"posts">>[]>(
    () => [
      {
        accessorKey: "thumbnail_url",
        header: "Thumbnail",
        cell: ({ row }) => {
          const url = row.getValue("thumbnail_url") as string | null;
          return (
            <div className="flex justify-center">
              {url ? (
                <Image
                  src={url}
                  alt="Post thumbnail"
                  className="object-cover rounded"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  No image
                </div>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "caption",
        header: "Caption",
        cell: ({ row }) => {
          const caption = row.getValue("caption") as string | null;
          return caption ? (
            <div className="max-w-xs truncate text-center" title={caption}>
              {caption}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No caption</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => {
          const platform = row.getValue("platform") as string;
          return (
            <div className="flex justify-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {platform}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "likes",
        header: ({ column }) => (
          <SortableHeader column={column}>Likes</SortableHeader>
        ),
        cell: ({ row }) => {
          const likes = row.getValue("likes") as number | null;
          return (
            <div className="font-medium">
              {likes?.toLocaleString() || 0}
            </div>
          );
        },
      },
      {
        accessorKey: "comments",
        header: ({ column }) => (
          <SortableHeader column={column}>Comments</SortableHeader>
        ),
        cell: ({ row }) => {
          const comments = row.getValue("comments") as number | null;
          return (
            <div className="font-medium">
              {comments?.toLocaleString() || 0}
            </div>
          );
        },
      },
      {
        accessorKey: "shares",
        header: ({ column }) => (
          <SortableHeader column={column}>Shares</SortableHeader>
        ),
        cell: ({ row }) => {
          const shares = row.getValue("shares") as number | null;
          return (
            <div className="font-medium">
              {shares?.toLocaleString() || 0}
            </div>
          );
        },
      },
      {
        accessorKey: "engagement_rate",
        header: ({ column }) => (
          <SortableHeader column={column}>Engagement Rate</SortableHeader>
        ),
        cell: ({ row }) => {
          const rate = row.getValue("engagement_rate") as number | null;
          return (
            <div className="font-medium">{rate?.toFixed(2)}%</div>
          );
        },
      },
      {
        accessorKey: "posted_at",
        header: ({ column }) => (
          <SortableHeader column={column}>Posted Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("posted_at") as string;
          return <div className="text-sm text-center">{formatShortDate(date)}</div>;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: posts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600 font-medium">Error loading posts</p>
        <p className="text-sm text-red-500 mt-2">Please try again later</p>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content</h2>
            <p className="text-sm text-gray-500 mt-1">
              Access your published posts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Platform:
            </label>
            <Select
              value={platformFilter || "all"}
              onValueChange={(value) =>
                setPlatformFilter(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No posts found
              </h3>
              <p className="text-sm text-gray-500">
                {platformFilter
                  ? `No ${platformFilter} posts available. Try a different filter.`
                  : "No posts available yet. Create your first post to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className="border-b border-gray-200 bg-gray-50/50"
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="text-sm font-medium text-gray-600 h-12 text-center"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0"
                        onClick={() => openPostModal(row.original.id)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-4 text-center">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden divide-y">
                {table.getRowModel().rows.map((row) => {
                  const post = row.original;
                  return (
                    <div
                      key={row.id}
                      className="p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => openPostModal(post.id)}
                    >
                      <div className="flex gap-3">
                        {post.thumbnail_url ? (
                          <Image
                            src={post.thumbnail_url}
                            alt="Post thumbnail"
                            className="object-cover rounded"
                            width={64}
                            height={64}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                            No image
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {post.platform}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(post.posted_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "UTC",
                                }
                              )}
                            </span>
                          </div>
                          {post.caption && (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {post.caption}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Likes:</span>{" "}
                          <span className="font-medium">
                            {post.likes?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Comments:</span>{" "}
                          <span className="font-medium">
                            {post.comments?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Shares:</span>{" "}
                          <span className="font-medium">
                            {post.shares?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Engagement:</span>{" "}
                          <span className="font-medium">
                            {post.engagement_rate?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <PostDetailModal
          postId={selectedPostId}
          open={isPostModalOpen}
          onOpenChange={(open) => !open && closePostModal()}
        />

        {!isLoading && posts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-600 whitespace-nowrap">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, total)} of {total} posts
              </span>
              <div className="flex flex-row items-center gap-2">
                <span>Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[70px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Pagination className="m-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    className={
                      currentPage === 1 || isLoading
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>

                {(() => {
                  const pages = [];
                  const showEllipsisStart = currentPage > 3;
                  const showEllipsisEnd = currentPage < totalPages - 2;

                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i)}
                            isActive={currentPage === i}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  } else {
                    pages.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          onClick={() => setCurrentPage(1)}
                          isActive={currentPage === 1}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    );

                    if (showEllipsisStart) {
                      pages.push(
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i)}
                            isActive={currentPage === i}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (showEllipsisEnd) {
                      pages.push(
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    pages.push(
                      <PaginationItem key={totalPages}>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          isActive={currentPage === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  return pages;
                })()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className={
                      currentPage === totalPages || isLoading
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </Card>
  );
}
