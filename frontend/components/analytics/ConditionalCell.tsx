"use client";

import React from "react";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ConditionalCell                                                   */
/* ------------------------------------------------------------------ */

export interface ConditionalCellProps {
  value: number;
  format: "currency" | "percent" | "number" | "roas";
  currency?: "INR" | "USD" | "EUR" | "GBP";
  /** value >= this = green */
  greenThreshold?: number;
  /** value <= this = red */
  redThreshold?: number;
  /** true for metrics where lower = better (e.g. CPC) */
  invertColor?: boolean;
  /** Previous-period value for change badge */
  previousValue?: number;
  /** Show change badge next to value */
  showChange?: boolean;
}

function formatValue(
  value: number,
  format: ConditionalCellProps["format"],
  currency: ConditionalCellProps["currency"]
): string {
  switch (format) {
    case "currency":
      return formatCurrency(value, currency ?? "INR");
    case "percent":
      return formatPercent(value);
    case "roas":
      return `${value.toFixed(2)}x`;
    case "number":
    default:
      return formatNumber(value);
  }
}

type Zone = "green" | "amber" | "red" | "neutral";

function resolveZone(
  value: number,
  greenThreshold?: number,
  redThreshold?: number,
  invertColor?: boolean
): Zone {
  if (greenThreshold === undefined && redThreshold === undefined)
    return "neutral";

  if (invertColor) {
    // Lower is better (e.g. CPC)
    if (redThreshold !== undefined && value >= redThreshold) return "red";
    if (greenThreshold !== undefined && value <= greenThreshold) return "green";
    return "amber";
  }

  // Higher is better (default)
  if (greenThreshold !== undefined && value >= greenThreshold) return "green";
  if (redThreshold !== undefined && value <= redThreshold) return "red";
  return "amber";
}

const zoneStyles: Record<Zone, string> = {
  green: "bg-green-500/10 text-green-400",
  amber: "bg-amber-500/10 text-amber-400",
  red: "bg-red-500/10 text-red-400",
  neutral: "text-gray-300",
};

function changeBadge(current: number, previous: number): React.ReactNode {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const arrow = pct >= 0 ? "\u2191" : "\u2193";
  const color = pct >= 0 ? "text-green-400" : "text-red-400";
  return (
    <span
      className={cn(
        "ml-1.5 inline-flex items-center text-[10px] font-medium",
        color
      )}
    >
      {arrow}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function ConditionalCell({
  value,
  format,
  currency,
  greenThreshold,
  redThreshold,
  invertColor,
  previousValue,
  showChange,
}: ConditionalCellProps) {
  const zone = resolveZone(value, greenThreshold, redThreshold, invertColor);

  return (
    <td
      className={cn(
        "px-3 py-2 text-right text-sm whitespace-nowrap",
        zoneStyles[zone]
      )}
    >
      {formatValue(value, format, currency)}
      {showChange && previousValue !== undefined
        ? changeBadge(value, previousValue)
        : null}
    </td>
  );
}

/* ------------------------------------------------------------------ */
/*  RowHealthDot                                                      */
/* ------------------------------------------------------------------ */

export interface RowHealthDotProps {
  roas: number;
  ctr: number;
  cvr: number;
  cpc: number;
  targets: {
    roasTarget: number;
    ctrTarget: number;
    cvrTarget: number;
    cpcTarget: number;
  };
}

type DotColor = "red" | "yellow" | "green";

function metricZone(
  value: number,
  target: number,
  invert: boolean
): "green" | "amber" | "red" {
  const ratio = value / target;
  if (invert) {
    // CPC: lower is better
    if (ratio <= 1) return "green";
    if (ratio <= 1.5) return "amber";
    return "red";
  }
  // ROAS, CTR, CVR: higher is better
  if (ratio >= 1) return "green";
  if (ratio >= 0.5) return "amber";
  return "red";
}

const dotColorMap: Record<DotColor, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-green-500",
};

export function RowHealthDot({ roas, ctr, cvr, cpc, targets }: RowHealthDotProps) {
  const zones = [
    metricZone(roas, targets.roasTarget, false),
    metricZone(ctr, targets.ctrTarget, false),
    metricZone(cvr, targets.cvrTarget, false),
    metricZone(cpc, targets.cpcTarget, true),
  ];

  let color: DotColor = "green";
  if (zones.includes("red")) color = "red";
  else if (zones.includes("amber")) color = "yellow";

  const labels: Record<DotColor, string> = {
    red: "One or more metrics in critical zone",
    yellow: "One or more metrics need attention",
    green: "All metrics healthy",
  };

  return (
    <span
      className={cn("inline-block w-2.5 h-2.5 rounded-full", dotColorMap[color])}
      title={labels[color]}
      role="status"
      aria-label={labels[color]}
    />
  );
}
