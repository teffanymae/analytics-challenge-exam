"use client";

import { useState } from "react";
import { useDailyMetrics } from "@/lib/hooks/use-daily-metrics";
import { useUIStore } from "@/lib/stores/ui-store";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Users } from "lucide-react";
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

type MetricView = "both" | "engagement" | "reach";

interface ChartData {
  date: Date;
  engagement: number;
  reach: number;
}

interface ChartProps {
  data: ChartData[];
  width: number;
  height: number;
  chartType: "line" | "area";
  metricView: MetricView;
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

function Chart({ data, width, height, chartType, metricView }: ChartProps) {
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

  const xScale = scaleTime({
    domain: [
      Math.min(...data.map((d) => d.date.getTime())),
      Math.max(...data.map((d) => d.date.getTime())),
    ],
    range: [0, innerWidth],
  });

  const maxEngagement = Math.max(...data.map((d) => d.engagement));
  const maxReach = Math.max(...data.map((d) => d.reach));
  const maxValue = Math.max(maxEngagement, maxReach);
  const yScale = scaleLinear({
    domain: [0, maxValue * 1.1],
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

    if (!d0 && !d1) return;

    const d =
      d1 &&
      d0 &&
      x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf()
        ? d1
        : d0;

    if (!d) return;

    showTooltip({
      tooltipData: d,
      tooltipLeft: xScale(d.date),
      tooltipTop: yScale(d.engagement),
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
              {(metricView === "both" || metricView === "engagement") && (
                <AreaClosed
                  data={data}
                  x={(d: ChartData) => xScale(d.date)}
                  y={(d: ChartData) => yScale(d.engagement)}
                  yScale={yScale}
                  strokeWidth={2}
                  stroke="#3b82f6"
                  fill="url(#area-gradient-engagement)"
                  curve={curveMonotoneX}
                />
              )}
              {(metricView === "both" || metricView === "reach") && (
                <AreaClosed
                  data={data}
                  x={(d: ChartData) => xScale(d.date)}
                  y={(d: ChartData) => yScale(d.reach)}
                  yScale={yScale}
                  strokeWidth={2}
                  stroke="#10b981"
                  fill="url(#area-gradient-reach)"
                  curve={curveMonotoneX}
                />
              )}
            </>
          ) : (
            <>
              {(metricView === "both" || metricView === "engagement") && (
                <LinePath
                  data={data}
                  x={(d: ChartData) => xScale(d.date)}
                  y={(d: ChartData) => yScale(d.engagement)}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  curve={curveMonotoneX}
                />
              )}
              {(metricView === "both" || metricView === "reach") && (
                <LinePath
                  data={data}
                  x={(d: ChartData) => xScale(d.date)}
                  y={(d: ChartData) => yScale(d.reach)}
                  stroke="#10b981"
                  strokeWidth={2}
                  curve={curveMonotoneX}
                />
              )}
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
            <>
              {(metricView === "both" || metricView === "engagement") && (
                <circle
                  cx={xScale(tooltipData.date)}
                  cy={yScale(tooltipData.engagement)}
                  r={4}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
              {(metricView === "both" || metricView === "reach") && (
                <circle
                  cx={xScale(tooltipData.date)}
                  cy={yScale(tooltipData.reach)}
                  r={4}
                  fill="#10b981"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            </>
          )}
        </Group>

        <defs>
          <linearGradient
            id="area-gradient-engagement"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="area-gradient-reach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
            <strong>{formatShortDate(tooltipData.date.toISOString())}</strong>
          </div>
          <div>Engagement: {tooltipData.engagement.toLocaleString()}</div>
          <div>Reach: {tooltipData.reach.toLocaleString()}</div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

export function DailyMetricsChart({ days }: { days: number }) {
  const chartType = useUIStore((state) => state.dailyMetricsChartType);
  const setChartType = useUIStore((state) => state.setDailyMetricsChartType);
  const [showEngagement, setShowEngagement] = useState(true);
  const [showReach, setShowReach] = useState(true);

  const metricView: MetricView = 
    showEngagement && showReach ? "both" :
    showEngagement ? "engagement" :
    showReach ? "reach" : "both";

  const { data, isLoading, error } = useDailyMetrics(days);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Failed to load daily metrics
        </div>
      </Card>
    );
  }

  if (!data || !data.metrics.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">No metrics available</div>
      </Card>
    );
  }

  const chartData: ChartData[] = data.metrics.map((m) => ({
    date: new Date(m.date),
    engagement: m.engagement,
    reach: m.reach,
  }));

  const totalEngagement = data.metrics.reduce(
    (sum, m) => sum + m.engagement,
    0
  );
  const totalReach = data.metrics.reduce((sum, m) => sum + m.reach, 0);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Metrics</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your engagement and reach over time
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
          <Card className="w-full p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Engagement</p>
                  <p className="text-2xl font-bold">
                    {totalEngagement.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="w-full p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Reach</p>
                  <p className="text-2xl font-bold">
                    {totalReach.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">
              Showing {data.period.days} days
            </span>
          </div>
          <ParentSize>
            {({ width }) => (
              <Chart
                data={chartData}
                width={width}
                height={320}
                chartType={chartType}
                metricView={metricView}
              />
            )}
          </ParentSize>
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              onClick={() => setShowEngagement(!showEngagement)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border-2"
              style={{
                backgroundColor: showEngagement ? "#dbeafe" : "#f3f4f6",
                borderColor: showEngagement ? "#2563eb" : "#d1d5db",
                opacity: showEngagement ? 1 : 0.4,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: showEngagement ? "#2563eb" : "#9ca3af",
                }}
              ></div>
              <span
                className="text-sm font-medium"
                style={{
                  color: showEngagement ? "#1e3a8a" : "#6b7280",
                }}
              >
                Engagement
              </span>
            </button>
            <button
              onClick={() => setShowReach(!showReach)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border-2"
              style={{
                backgroundColor: showReach ? "#dcfce7" : "#f3f4f6",
                borderColor: showReach ? "#16a34a" : "#d1d5db",
                opacity: showReach ? 1 : 0.4,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: showReach ? "#16a34a" : "#9ca3af",
                }}
              ></div>
              <span
                className="text-sm font-medium"
                style={{
                  color: showReach ? "#14532d" : "#6b7280",
                }}
              >
                Reach
              </span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
