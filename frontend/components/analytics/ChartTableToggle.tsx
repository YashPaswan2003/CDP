"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartTableToggleProps {
  viewMode: "chart" | "table" | "both";
  onViewModeChange: (mode: "chart" | "table" | "both") => void;
  data: Array<{ name: string; [metric: string]: number | string }>;
  chartMetric: string;
  onChartMetricChange: (metric: string) => void;
  availableMetrics: string[];
  currency?: string;
}

const VIEW_MODES: Array<{ key: "chart" | "table" | "both"; label: string }> = [
  { key: "chart", label: "Chart" },
  { key: "table", label: "Table" },
  { key: "both", label: "Both" },
];

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function formatTooltipValue(value: number, metric: string, currency?: string): string {
  const cur = currency || "₹";
  const lower = metric.toLowerCase();
  if (lower === "spend") {
    const lakhs = value / 100000;
    return `${cur}${lakhs.toFixed(1)}L`;
  }
  if (lower === "roas") return `${value.toFixed(1)}x`;
  if (lower === "ctr" || lower === "cvr") return `${value.toFixed(2)}%`;
  if (lower === "cpc") return `${cur}${value.toFixed(2)}`;
  if (lower === "revenue") {
    const lakhs = value / 100000;
    return `${cur}${lakhs.toFixed(1)}L`;
  }
  return value.toLocaleString("en-IN");
}

function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    spend: "Spend",
    roas: "ROAS",
    ctr: "CTR",
    cvr: "CVR",
    cpc: "CPC",
    conversions: "Conversions",
    impressions: "Impressions",
    clicks: "Clicks",
    revenue: "Revenue",
  };
  return labels[metric.toLowerCase()] || metric;
}

export default function ChartTableToggle({
  viewMode,
  onViewModeChange,
  data,
  chartMetric,
  onChartMetricChange,
  availableMetrics,
  currency,
}: ChartTableToggleProps) {
  // Sort data by selected metric descending for the chart
  const sortedData = [...data]
    .filter((d) => typeof d[chartMetric] === "number")
    .sort((a, b) => (b[chartMetric] as number) - (a[chartMetric] as number))
    .map((d) => ({
      ...d,
      _truncatedName: truncate(String(d.name), 15),
    }));

  const showChart = viewMode === "chart" || viewMode === "both";

  return (
    <div className="space-y-4">
      {/* Toggle bar + metric selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Metric pills (only visible when chart is shown) */}
        {showChart && (
          <div className="flex items-center gap-1.5">
            {availableMetrics.map((metric) => (
              <button
                key={metric}
                onClick={() => onChartMetricChange(metric)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  chartMetric === metric
                    ? "bg-primary-500 text-white ring-2 ring-primary-500/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                {getMetricLabel(metric)}
              </button>
            ))}
          </div>
        )}
        {!showChart && <div />}

        {/* View mode toggle */}
        <div className="flex items-center bg-surface-elevated rounded-lg p-0.5">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onViewModeChange(mode.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === mode.key
                  ? "bg-primary-500 text-white ring-2 ring-primary-500/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {showChart && sortedData.length > 0 && (
        <div className="bg-surface-base border border-border-primary rounded-xl p-4">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
              <XAxis
                type="number"
                stroke="#4B5563"
                style={{ fontSize: "11px" }}
                tick={{ fill: "#9CA3AF" }}
                tickFormatter={(val: number) =>
                  formatTooltipValue(val, chartMetric, currency)
                }
              />
              <YAxis
                type="category"
                dataKey="_truncatedName"
                stroke="#4B5563"
                style={{ fontSize: "11px" }}
                tick={{ fill: "#D1D5DB" }}
                width={105}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  color: "#1F2937",
                }}
                labelStyle={{ color: "#6B7280" }}
                formatter={(value: number) => [
                  formatTooltipValue(value, chartMetric, currency),
                  getMetricLabel(chartMetric),
                ]}
                labelFormatter={(_label: string, payload: Array<{ payload?: { name?: string } }>) => {
                  if (payload && payload[0]?.payload?.name) {
                    return payload[0].payload.name;
                  }
                  return _label;
                }}
              />
              <Bar dataKey={chartMetric} radius={[0, 6, 6, 0]}>
                {sortedData.map((_entry, index) => {
                  let fill = "#818CF8"; // indigo-400
                  if (index === 0) fill = "#6366F1"; // indigo-500 for top
                  if (index === sortedData.length - 1) fill = "#A5B4FC"; // indigo-300 for bottom
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
