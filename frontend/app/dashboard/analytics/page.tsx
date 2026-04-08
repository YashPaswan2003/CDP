"use client";

import { useState, useMemo } from "react";
import { ChartContainer, LineChart, BarChart } from "@/components";
import { generateDailyMetrics, getPeriodComparisons } from "@/lib/mockData";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [compareToPreview, setCompareToPreview] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<"spend" | "revenue" | "ctr" | "roas" | "cvr">("spend");

  const dailyMetrics = generateDailyMetrics();
  const periodData = getPeriodComparisons();

  // Aggregate metrics by platform
  const platformComparison = useMemo(() => {
    const platforms: { [key: string]: any } = {};

    dailyMetrics.forEach((metric) => {
      if (!platforms[metric.platform]) {
        platforms[metric.platform] = {
          name: metric.platform.toUpperCase(),
          impressions: 0,
          clicks: 0,
          spend: 0,
          revenue: 0,
          conversions: 0,
        };
      }

      platforms[metric.platform].impressions += metric.impressions;
      platforms[metric.platform].clicks += metric.clicks;
      platforms[metric.platform].spend += metric.spend;
      platforms[metric.platform].revenue += metric.revenue;
      platforms[metric.platform].conversions += metric.conversions;
    });

    return Object.values(platforms);
  }, [dailyMetrics]);

  const currentPeriodData = periodData[dateRange === "7d" ? "week" : dateRange === "30d" ? "month" : "quarter"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Analytics</h1>
        <p className="text-text-secondary">Deep dive into performance metrics and trends</p>
      </div>

      {/* Date Range Selector */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange("7d")}
              className={`px-4 py-2 rounded transition-colors ${
                dateRange === "7d" ? "bg-primary-500 text-white" : "bg-surface-hover text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange("30d")}
              className={`px-4 py-2 rounded transition-colors ${
                dateRange === "30d" ? "bg-primary-500 text-white" : "bg-surface-hover text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange("90d")}
              className={`px-4 py-2 rounded transition-colors ${
                dateRange === "90d" ? "bg-primary-500 text-white" : "bg-surface-hover text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              Last 90 Days
            </button>
          </div>

          <label className="flex items-center gap-3 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={compareToPreview}
              onChange={(e) => setCompareToPreview(e.target.checked)}
              className="w-4 h-4 rounded accent-primary-500"
            />
            <span className="text-text-secondary text-sm">Compare to previous period</span>
          </label>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="card">
        <p className="text-text-secondary text-sm mb-3">Select metric to display:</p>
        <div className="flex flex-wrap gap-2">
          {(["spend", "revenue", "ctr", "roas", "cvr"] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                selectedMetric === metric
                  ? "bg-primary-500 text-white"
                  : "bg-surface-hover text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Over Time Chart */}
      <ChartContainer title={`${selectedMetric.toUpperCase()} Over Time`}>
        <LineChart
          data={dailyMetrics}
          dataKeys={[
            { key: "spend", name: "Spend ($)", color: "#3B82F6" },
            { key: "revenue", name: "Revenue ($)", color: "#10B981" },
            { key: "clicks", name: "Clicks", color: "#F59E0B" },
            { key: "impressions", name: "Impressions", color: "#8B5CF6" },
          ]}
          height={350}
        />
      </ChartContainer>

      {/* Platform Comparison */}
      <ChartContainer title="Platform Comparison">
        <BarChart
          data={platformComparison}
          dataKeys={[
            { key: "spend", name: "Spend", color: "#3B82F6" },
            { key: "revenue", name: "Revenue", color: "#10B981" },
            { key: "conversions", name: "Conversions", color: "#F59E0B" },
          ]}
          xAxisKey="name"
          layout="horizontal"
          height={300}
        />
      </ChartContainer>

      {/* Period Comparison Table */}
      <ChartContainer title={`Period Comparison (${dateRange === "7d" ? "Week" : dateRange === "30d" ? "Month" : "Quarter"})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left py-3 px-4 text-text-secondary">Metric</th>
                <th className="text-right py-3 px-4 text-text-secondary">Current</th>
                <th className="text-right py-3 px-4 text-text-secondary">Previous</th>
                <th className="text-right py-3 px-4 text-text-secondary">Change</th>
                <th className="text-right py-3 px-4 text-text-secondary">% Change</th>
              </tr>
            </thead>
            <tbody>
              {currentPeriodData.map((row, idx) => (
                <tr key={idx} className="border-b border-border-primary hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4 text-text-primary font-medium">{row.metric}</td>
                  <td className="text-right py-3 px-4 text-text-primary font-semibold">
                    {typeof row.currentValue === "number" && row.currentValue > 100
                      ? `$${row.currentValue.toLocaleString()}`
                      : row.currentValue.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-text-secondary">
                    {typeof row.previousValue === "number" && row.previousValue > 100
                      ? `$${row.previousValue.toLocaleString()}`
                      : row.previousValue.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-text-secondary">
                    {(row.currentValue - row.previousValue).toFixed(2)}
                  </td>
                  <td className={`text-right py-3 px-4 font-semibold ${row.changePercent > 0 ? "text-accent-success" : "text-accent-error"}`}>
                    {row.changePercent > 0 ? "+" : ""}{row.changePercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
}
