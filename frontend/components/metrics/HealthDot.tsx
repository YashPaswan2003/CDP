import React from "react";
import { cn } from "@/lib/utils";

interface HealthDotProps {
  current: number;
  previous: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

/**
 * Health status thresholds (extracted for reuse across components)
 * - ERROR_THRESHOLD: < -20% decline = red
 * - WARNING_THRESHOLD: -10% to -20% decline = yellow
 * - >= -10% = green (on track)
 */
export const HEALTH_THRESHOLDS = {
  ERROR_THRESHOLD: -0.2,
  WARNING_THRESHOLD: -0.1,
} as const;

/**
 * Calculates health status based on percentage change
 * Red: >20% decline, Yellow: 10-20% decline, Green: on-track (within +/- 10%)
 * Gray: no data available (both current and previous are 0)
 */
function getHealthStatus(current: number, previous: number): "error" | "warning" | "success" | "no-data" {
  if (current === 0 && previous === 0) return "no-data";
  if (previous === 0 || !previous) return "success";
  const change = (current - previous) / previous;
  if (change < HEALTH_THRESHOLDS.ERROR_THRESHOLD) return "error";
  if (change < HEALTH_THRESHOLDS.WARNING_THRESHOLD) return "warning";
  return "success";
}

/**
 * Calculates the percentage change for tooltips/labels
 */
function getChangePercent(current: number, previous: number): string {
  if (previous === 0 || !previous) return "0%";
  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
}

export function HealthDot({ current, previous, size = "md", showTooltip = true }: HealthDotProps) {
  const status = getHealthStatus(current, previous);
  const changePercent = getChangePercent(current, previous);

  const sizeMap: Record<"sm" | "md" | "lg", string> = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colorMap = {
    error: "bg-accent-error",
    warning: "bg-accent-warning",
    success: "bg-accent-success",
    "no-data": "bg-gray-500",
  };

  const tooltipMap = {
    error: `Change: ${changePercent} (Declining)`,
    warning: `Change: ${changePercent} (Warning)`,
    success: `Change: ${changePercent} (On Track)`,
    "no-data": "No data available",
  };

  return (
    <div
      className={cn(sizeMap[size], "rounded-full", colorMap[status], "flex-shrink-0")}
      title={showTooltip ? tooltipMap[status] : undefined}
      role="status"
      aria-label={
        status === "no-data"
          ? "Health status: no data"
          : `Health status: ${status}. ${tooltipMap[status]}`
      }
    />
  );
}

export { getHealthStatus, getChangePercent };
