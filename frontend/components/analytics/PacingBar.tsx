"use client";

import React from "react";
import { formatCurrency, cn } from "@/lib/utils";

export interface PacingBarProps {
  spent: number;
  budget: number;
  /** Day of the current month (1-31). Defaults to today. */
  dayOfMonth?: number;
  /** Total days in the current month. Defaults to current month. */
  daysInMonth?: number;
  currency?: "INR" | "USD" | "EUR" | "GBP";
  /** If true, render only the bar without text. */
  compact?: boolean;
}

function todayDay(): number {
  return new Date().getDate();
}

function currentMonthDays(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

type PaceZone = "green" | "orange" | "red";

function getPaceZone(pacingPct: number): PaceZone {
  if (pacingPct >= 80 && pacingPct <= 105) return "green";
  if ((pacingPct >= 60 && pacingPct < 80) || (pacingPct > 105 && pacingPct <= 120))
    return "orange";
  return "red";
}

const barColors: Record<PaceZone, string> = {
  green: "bg-green-500",
  orange: "bg-amber-500",
  red: "bg-red-500",
};

export function PacingBar({
  spent,
  budget,
  dayOfMonth,
  daysInMonth,
  currency = "INR",
  compact = false,
}: PacingBarProps) {
  const day = dayOfMonth ?? todayDay();
  const totalDays = daysInMonth ?? currentMonthDays();

  const expectedPace = (day / totalDays) * budget;
  const pacingPct = expectedPace > 0 ? (spent / expectedPace) * 100 : 0;
  const fillPct = Math.min((spent / budget) * 100, 100);
  const zone = getPaceZone(pacingPct);

  const spentFmt = formatCurrency(spent, currency);
  const budgetFmt = formatCurrency(budget, currency);
  const pctLabel = `${Math.round(fillPct)}%`;

  return (
    <div className={cn("flex flex-col gap-1", compact ? "w-full" : "w-28")}>
      {/* Track */}
      <div className="bg-surface-active rounded-full h-2 w-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColors[zone])}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {/* Text label */}
      {!compact && (
        <span className="text-[10px] text-text-tertiary leading-tight">
          {spentFmt} / {budgetFmt} ({pctLabel})
        </span>
      )}
    </div>
  );
}
