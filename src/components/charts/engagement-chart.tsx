"use client";

import { useState } from "react";
import { useEngagement } from "@/lib/hooks/use-engagement";
import { useUIStore } from "@/lib/stores/ui-store";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { AreaClosed, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { bisector } from "d3-array";
import { formatShortDate } from "@/lib/date";

type MetricType = "likes" | "comments" | "shares" | "saves";

function MetricCard({
  title,
  icon,
  current,
  change,
  isSelected,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  current: number;
  change: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isPositive = change >= 0;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-600 bg-blue-100 border-blue-600" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{current.toLocaleString()}</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>
    </Card>
  );
}

interface ChartData {
  date: Date;
  value: number;
  period: "current" | "previous";
}

interface ChartProps {
  data: ChartData[];
  width: number;
  height: number;
  chartType: "line" | "area";
  metric: string;
}

const tooltipStyles = {
  ...defaultStyles,
  background: "#1f2937",
  border: "1px solid #374151",
  color: "white",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "12px",
};

const bisectDate = bisector<ChartData, Date>((d) => d.date).left;

function Chart({ data, width, height, chartType, metric }: ChartProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<ChartData>();

  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  if (innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  const currentData = data.filter((d) => d.period === "current");
  const previousData = data.filter((d) => d.period === "previous");

  const xScale = scaleTime({
    domain: [
      Math.min(...data.map((d) => d.date.getTime())),
      Math.max(...data.map((d) => d.date.getTime())),
    ],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.value)) * 1.1],
    range: [innerHeight, 0],
    nice: true,
  });

  const handleTooltip = (
    event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
  ) => {
    const point = localPoint(event);
    if (!point) return;

    const x0 = xScale.invert(point.x - margin.left);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];

    const d =
      d1 && x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf()
        ? d1
        : d0;

    showTooltip({
      tooltipData: d,
      tooltipLeft: xScale(d.date),
      tooltipTop: yScale(d.value),
    });
  };

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            height={innerHeight}
            stroke="#e5e7eb"
            strokeOpacity={0.5}
          />

          {chartType === "area" ? (
            <>
              <AreaClosed
                data={previousData}
                x={(d: ChartData) => xScale(d.date)}
                y={(d: ChartData) => yScale(d.value)}
                yScale={yScale}
                strokeWidth={2}
                stroke="#9ca3af"
                fill="url(#area-gradient-previous)"
                curve={curveMonotoneX}
              />
              <AreaClosed
                data={currentData}
                x={(d: ChartData) => xScale(d.date)}
                y={(d: ChartData) => yScale(d.value)}
                yScale={yScale}
                strokeWidth={2}
                stroke="#3b82f6"
                fill="url(#area-gradient)"
                curve={curveMonotoneX}
              />
            </>
          ) : (
            <>
              <LinePath
                data={previousData}
                x={(d: ChartData) => xScale(d.date)}
                y={(d: ChartData) => yScale(d.value)}
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="4,4"
                curve={curveMonotoneX}
              />
              <LinePath
                data={currentData}
                x={(d: ChartData) => xScale(d.date)}
                y={(d: ChartData) => yScale(d.value)}
                stroke="#3b82f6"
                strokeWidth={2}
                curve={curveMonotoneX}
              />
            </>
          )}

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={6}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            tickLabelProps={() => ({
              fill: "#6b7280",
              fontSize: 11,
              textAnchor: "middle",
            })}
          />

          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            tickLabelProps={() => ({
              fill: "#6b7280",
              fontSize: 11,
              textAnchor: "end",
              dx: -4,
            })}
          />

          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
          />

          {tooltipData && (
            <circle
              cx={xScale(tooltipData.date)}
              cy={yScale(tooltipData.value)}
              r={4}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </Group>

        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient
            id="area-gradient-previous"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#9ca3af" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={(tooltipTop || 0) + margin.top}
          left={(tooltipLeft || 0) + margin.left}
          style={tooltipStyles}
        >
          <div>
            <strong>
              {formatShortDate(tooltipData.date.toLocaleString())}
            </strong>
          </div>
          <div>
            {metric}: {tooltipData.value.toLocaleString()}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

export function EngagementChart({ days }: { days: number }) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("likes");
  const chartType = useUIStore((state) => state.engagementChartType);
  const setChartType = useUIStore((state) => state.setEngagementChartType);

  const { data, isLoading, error } = useEngagement(days);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Failed to load engagement data
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const metricConfig = {
    likes: {
      title: "Likes",
      icon: <Heart className="w-5 h-5 text-red-500" />,
      data: data.summary.likes,
    },
    comments: {
      title: "Comments",
      icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
      data: data.summary.comments,
    },
    shares: {
      title: "Shares",
      icon: <Share2 className="w-5 h-5 text-green-500" />,
      data: data.summary.shares,
    },
    saves: {
      title: "Saves",
      icon: <Bookmark className="w-5 h-5 text-purple-500" />,
      data: data.summary.saves,
    },
  };

  const chartData: ChartData[] = [
    ...data.previous.map((d, index) => ({
      date: new Date(
        new Date(data.current[0].date).getTime() -
          (data.previous.length - index) * 24 * 60 * 60 * 1000
      ),
      value: d[selectedMetric],
      period: "previous" as const,
    })),
    ...data.current.map((d) => ({
      date: new Date(d.date),
      value: d[selectedMetric],
      period: "current" as const,
    })),
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Insights</h2>
            <p className="text-sm text-gray-500 mt-1">
              Learn how your Page is performing.
            </p>
          </div>

          <div className="flex flex-row items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Chart Type:
            </label>
            <Select
              value={chartType}
              onValueChange={(value) => setChartType(value as "line" | "area")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {(Object.keys(metricConfig) as MetricType[]).map((metric) => (
            <div key={metric} className="flex-1">
              <MetricCard
                title={metricConfig[metric].title}
                icon={metricConfig[metric].icon}
                current={metricConfig[metric].data.current}
                change={metricConfig[metric].data.change}
                isSelected={selectedMetric === metric}
                onClick={() => setSelectedMetric(metric)}
              />
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600"></div>
              <span className="text-sm text-gray-600">Current Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-0.5 bg-gray-400 border-dashed"
                style={{ borderTop: "2px dashed #9ca3af", background: "none" }}
              ></div>
              <span className="text-sm text-gray-600">Previous Period</span>
            </div>
          </div>
          <ParentSize>
            {({ width }) => (
              <Chart
                data={chartData}
                width={width}
                height={400}
                chartType={chartType}
                metric={metricConfig[selectedMetric].title}
              />
            )}
          </ParentSize>
        </div>
      </div>
    </Card>
  );
}
