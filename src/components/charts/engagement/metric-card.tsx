import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface EngagementMetricCardProps {
  title: string;
  icon: React.ReactNode;
  current: number;
  change: number;
  isSelected: boolean;
  onClick: () => void;
}

export function EngagementMetricCard({
  title,
  icon,
  current,
  change,
  isSelected,
  onClick,
}: EngagementMetricCardProps) {
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
