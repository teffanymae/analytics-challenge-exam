import dayjs from "dayjs";
import dayjsDayOfYear from "dayjs/plugin/dayOfYear";
import isLeapYear from "dayjs/plugin/isLeapYear";

dayjs.extend(dayjsDayOfYear);
dayjs.extend(isLeapYear);

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ComparisonPeriods {
  current: DateRange;
  previous: DateRange;
}

export function getMaxDaysForYear(): number {
  return dayjs().isLeapYear() ? 366 : 365;
}

export function calculateDateRange(days: number, includeToday = false): DateRange {
  const endDate = includeToday ? new Date() : new Date();
  if (!includeToday) {
    endDate.setDate(endDate.getDate() - 1);
  }
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return { startDate, endDate };
}

export function calculateComparisonPeriods(days: number): ComparisonPeriods {
  const current = calculateDateRange(days, false);
  
  const previousEndDate = new Date(current.startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);

  return {
    current,
    previous: {
      startDate: previousStartDate,
      endDate: previousEndDate,
    },
  };
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function fillDateGaps<T extends { date: string }>(
  startDate: Date,
  endDate: Date,
  dataMap: Map<string, T>,
  defaultValue: (dateStr: string) => T
): T[] {
  const result: T[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = formatDate(current);
    result.push(dataMap.get(dateStr) || defaultValue(dateStr));
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}
