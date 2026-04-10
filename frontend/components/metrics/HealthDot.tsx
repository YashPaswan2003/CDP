import React from "react";
import { cn } from "@/lib/utils";

interface HealthDotProps {
  current: number;
  previous: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

/**
 * Calculates health status based on percentage change
 * Red: >20% decline, Yellow: 10-20% decline, Green: on-track (within +/- 10%)
 */
function getHealthStatus(current: number, previous: number): "error" | "warning" | "success" {
  if (previous === 0 || !previous) return "success";
  const change = (current - previous) / previous;
  if (change < -0.2) return "error";    // < -20% decline
  if (change < -0.1) return "warning";  // -20% to -10% decline
  return "success";                      // >= -10%
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

  const sizeMap = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colorMap = {
    error: "bg-red-500",
    warning: "bg-amber-500",
    success: "bg-green-500",
  };

  const tooltipMap = {
    error: `Change: ${changePercent} (Declining)`,
    warning: `Change: ${changePercent} (Warning)`,
    success: `Change: ${changePercent} (On Track)`,
  };

  return (
    <div
      className={cn(sizeMap[size], "rounded-full", colorMap[status], "flex-shrink-0")}
      title={showTooltip ? tooltipMap[status] : undefined}
      role="status"
      aria-label={`Health status: ${status}. ${tooltipMap[status]}`}
    />
  );
}

export { getHealthStatus, getChangePercent };
