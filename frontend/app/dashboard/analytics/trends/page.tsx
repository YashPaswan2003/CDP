"use client";

import { useState, useMemo, useEffect } from "react";
import { ChartContainer, LineChart } from "@/components";
import { fetchDailyMetrics } from "@/lib/api";
import { DailyMetric } from "@/lib/mockData";

// ============ CONSTANTS & CONFIG ============

const STAGE_METRICS: Record<"all" | "tofu" | "mofu" | "bofu", string[]> = {
  all:  ["spend", "revenue", "impressions", "clicks", "conversions", "roas", "ctr", "cpa"],
  tofu: ["impressions", "reach", "frequency", "cpm", "vtr", "cpv", "viewability", "thruPlays", "views"],
  mofu: ["clicks", "ctr", "cpc", "engagementRate"],
  bofu: ["conversions", "revenue", "roas", "cpa", "cvr", "vtc"],
};

const PLATFORM_EXTRA_METRICS: Record<string, string[]> = {
  google: ["viewability"],
  dv360:  ["vtc", "viewability"],
  meta:   ["reach", "frequency", "thruPlays"],
  all:    [],
};

const METRIC_CONFIG: Record<string, { label: string; color: string; format: "currency" | "percent" | "number" | "multiplier" }> = {
  spend:         { label: "Spend", color: "#3B82F6", format: "currency" },
  revenue:       { label: "Revenue", color: "#10B981", format: "currency" },
  impressions:   { label: "Impressions", color: "#F59E0B", format: "number" },
  clicks:        { label: "Clicks", color: "#8B5CF6", format: "number" },
  conversions:   { label: "Conversions", color: "#EC4899", format: "number" },
  roas:          { label: "ROAS", color: "#10B981", format: "multiplier" },
  ctr:           { label: "CTR", color: "#06B6D4", format: "percent" },
  cpa:           { label: "CPA", color: "#EF4444", format: "currency" },
  reach:         { label: "Reach", color: "#F97316", format: "number" },
  frequency:     { label: "Frequency", color: "#A78BFA", format: "number" },
  cpm:           { label: "CPM", color: "#34D399", format: "currency" },
  vtr:           { label: "VTR", color: "#60A5FA", format: "percent" },
  cpv:           { label: "CPV", color: "#FB923C", format: "currency" },
  viewability:   { label: "Viewability", color: "#4ADE80", format: "percent" },
  thruPlays:     { label: "ThruPlays", color: "#E879F9", format: "number" },
  engagementRate:{ label: "Eng. Rate", color: "#FCD34D", format: "percent" },
  vtc:           { label: "VTC", color: "#818CF8", format: "number" },
  cvr:           { label: "CVR", color: "#2DD4BF", format: "percent" },
  views:         { label: "Video Views", color: "#F472B6", format: "number" },
  cpc:           { label: "CPC", color: "#A78BFA", format: "currency" },
};

function getAvailableMetrics(stage: string, platform: string) {
  const base = STAGE_METRICS[stage as keyof typeof STAGE_METRICS] || STAGE_METRICS.all;
  const extra = PLATFORM_EXTRA_METRICS[platform] || [];
  return [...new Set([...base, ...extra])];
}

function formatMetricValue(value: number, format: "currency" | "percent" | "number" | "multiplier"): string {
  if (isNaN(value) || !isFinite(value)) return "0";

  switch (format) {
    case "currency":
      return `$${(value / 1).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    case "percent":
      return `${value.toFixed(2)}%`;
    case "multiplier":
      return `${value.toFixed(2)}x`;
    case "number":
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}

function computeMetricValue(metrics: DailyMetric[], key: string): number {
  if (metrics.length === 0) return 0;

  switch (key) {
    case "roas":
      const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
      const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
      return totalSpend > 0 ? totalRevenue / totalSpend : 0;
    case "ctr":
      const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
      const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
      return totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    case "cpa":
      const conversionCount = metrics.reduce((s, m) => s + m.conversions, 0);
      const spendForCpa = metrics.reduce((s, m) => s + m.spend, 0);
      return conversionCount > 0 ? spendForCpa / conversionCount : 0;
    case "cvr":
      const conversions = metrics.reduce((s, m) => s + m.conversions, 0);
      const clicks = metrics.reduce((s, m) => s + m.clicks, 0);
      return clicks > 0 ? (conversions / clicks) * 100 : 0;
    case "cpm":
      const impressions = metrics.reduce((s, m) => s + m.impressions, 0);
      const spend = metrics.reduce((s, m) => s + m.spend, 0);
      return impressions > 0 ? (spend / impressions) * 1000 : 0;
    case "vtr":
      return metrics.reduce((s, m) => s + m.vtr || 0, 0) / metrics.length;
    case "cpv":
      const views = metrics.reduce((s, m) => s + m.views || 0, 0);
      const spendForCpv = metrics.reduce((s, m) => s + m.spend, 0);
      return views > 0 ? spendForCpv / views : 0;
    case "frequency":
      return metrics.reduce((s, m) => s + (m.frequency || 0), 0) / metrics.length;
    case "viewability":
      return metrics.reduce((s, m) => s + (m.viewability || 0), 0) / metrics.length;
    case "engagementRate":
      return metrics.reduce((s, m) => s + (m.engagementRate || 0), 0) / metrics.length;
    default:
      return metrics.reduce((s, m) => s + (m[key as keyof DailyMetric] as number || 0), 0);
  }
}

// ============ COMPONENT ============

export default function TrendsPage() {
  const [selectedStage, setSelectedStage] = useState<"all" | "tofu" | "mofu" | "bofu">("all");
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "google" | "meta" | "dv360">("all");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["spend", "revenue", "impressions"]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const metrics = await fetchDailyMetrics();
      setDailyMetrics(metrics);
    };
    loadData();
  }, []);

  // Filter metrics by platform
  const filteredMetrics = useMemo(() => {
    if (selectedPlatform === "all") {
      return dailyMetrics;
    }
    return dailyMetrics.filter(m => m.platform === selectedPlatform);
  }, [dailyMetrics, selectedPlatform]);

  // Get available metrics based on stage and platform
  const availableMetrics = useMemo(() => {
    return getAvailableMetrics(selectedStage, selectedPlatform);
  }, [selectedStage, selectedPlatform]);

  // Generate metric options
  const metricOptions = useMemo(() => {
    return availableMetrics.map(key => ({
      value: key,
      label: METRIC_CONFIG[key]?.label || key,
    }));
  }, [availableMetrics]);

  // Prepare chart data keys
  const chartDataKeys = useMemo(() => {
    return selectedMetrics
      .filter(metricKey => availableMetrics.includes(metricKey))
      .map(metricKey => ({
        key: metricKey,
        name: METRIC_CONFIG[metricKey]?.label || metricKey,
        color: METRIC_CONFIG[metricKey]?.color || "#999",
      }));
  }, [selectedMetrics, availableMetrics]);

  // Compute metric summaries
  const metricSummaries = useMemo(() => {
    return selectedMetrics
      .filter(metricKey => availableMetrics.includes(metricKey))
      .map(metricKey => ({
        key: metricKey,
        label: METRIC_CONFIG[metricKey]?.label || metricKey,
        value: computeMetricValue(filteredMetrics, metricKey),
        format: METRIC_CONFIG[metricKey]?.format || "number",
        color: METRIC_CONFIG[metricKey]?.color || "#999",
      }));
  }, [selectedMetrics, filteredMetrics, availableMetrics]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Trends & Insights</h1>
        <p className="text-text-secondary">Multi-metric performance tracking by funnel stage</p>
      </div>

      {/* Filters Card */}
      <div className="card space-y-6">
        {/* Stage Filter */}
        <div className="space-y-2">
          <p className="text-xs text-[#9CA3AF] font-medium uppercase mb-2">Funnel Stage</p>
          <div className="flex gap-1 flex-wrap">
            {["all", "tofu", "mofu", "bofu"].map(stage => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage as any)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  selectedStage === stage
                    ? "bg-[#2962FF] text-white"
                    : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                }`}
              >
                {stage === "all" ? "All Stages" : stage.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Filter */}
        <div className="space-y-2">
          <p className="text-xs text-[#9CA3AF] font-medium uppercase mb-2">Platform</p>
          <div className="flex gap-1 flex-wrap">
            {["all", "google", "meta", "dv360"].map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform as any)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  selectedPlatform === platform
                    ? "bg-[#2962FF] text-white"
                    : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                }`}
              >
                {platform === "all" ? "All Platforms" : platform.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="space-y-2">
          <p className="text-xs text-[#9CA3AF] font-medium uppercase mb-2">Metrics</p>
          <div className="flex gap-1 flex-wrap">
            {metricOptions.map(({ value: metricKey, label }) => {
              const isSelected = selectedMetrics.includes(metricKey);
              return (
                <button
                  key={metricKey}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMetrics(m => m.filter(x => x !== metricKey));
                    } else {
                      setSelectedMetrics(m => [...m, metricKey]);
                    }
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    isSelected
                      ? "bg-[#2962FF] text-white"
                      : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      {selectedMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricSummaries.map(({ key, label, value, format, color }) => (
            <div key={key} className="card">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {formatMetricValue(value, format)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trends Chart */}
      {chartDataKeys.length > 0 && (
        <ChartContainer title="Performance Trends">
          <LineChart
            data={filteredMetrics}
            dataKeys={chartDataKeys}
            height={400}
          />
        </ChartContainer>
      )}

      {/* Empty State */}
      {selectedMetrics.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-text-secondary">Select at least one metric to view trends</p>
        </div>
      )}
    </div>
  );
}
