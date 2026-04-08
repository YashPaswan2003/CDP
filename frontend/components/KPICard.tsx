"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import React from "react";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; direction: "up" | "down" };
  icon: React.ReactNode;
  highlight?: "primary" | "success" | "warning" | "error";
}

const highlightColors = {
  primary: "text-primary-500",
  success: "text-accent-success",
  warning: "text-accent-warning",
  error: "text-accent-error",
};

const bgColors = {
  primary: "bg-primary-500/10",
  success: "bg-accent-success/10",
  warning: "bg-accent-warning/10",
  error: "bg-accent-error/10",
};

export default function KPICard({
  label,
  value,
  unit = "",
  trend,
  icon,
  highlight = "primary",
}: KPICardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColors[highlight]}`}>
          <div className={`${highlightColors[highlight]} text-2xl`}>{icon}</div>
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend.direction === "up" ? (
              <TrendingUp className="w-4 h-4 text-accent-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-accent-error" />
            )}
            <span
              className={`text-sm font-medium ${
                trend.direction === "up"
                  ? "text-accent-success"
                  : "text-accent-error"
              }`}
            >
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      <p className="text-text-secondary text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold text-text-primary">
        {value}
        {unit && <span className="text-sm text-text-tertiary ml-1">{unit}</span>}
      </p>
    </div>
  );
}
