"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export interface RCADimension {
  name: string;
  dimension: string; // "Campaign", "Geo", "Device", etc.
  currentValue: number;
  previousValue: number;
  contribution: number; // % of total change attributed to this dimension
}

export interface RCAPanelProps {
  isOpen: boolean;
  onClose: () => void;
  metric: string; // "ROAS", "CTR", etc.
  currentValue: number;
  previousValue: number;
  dimensions: RCADimension[];
  currency?: string;
}

function formatMetricValue(metric: string, value: number, currency?: string): string {
  const sym = currency === "USD" ? "$" : "\u20B9";
  switch (metric.toUpperCase()) {
    case "CTR":
    case "CVR":
      return `${value.toFixed(2)}%`;
    case "CPC":
    case "CPA":
    case "SPEND":
      return `${sym}${value.toLocaleString()}`;
    case "ROAS":
      return `${value.toFixed(2)}x`;
    default:
      return value.toLocaleString();
  }
}

function severityIcon(contribution: number): string {
  const abs = Math.abs(contribution);
  if (abs >= 30) return "\uD83D\uDD34"; // red circle
  if (abs >= 15) return "\uD83D\uDFE1"; // yellow circle
  return "\uD83D\uDFE2"; // green circle
}

function generateSuggestions(topDrivers: RCADimension[], metric: string): string[] {
  const suggestions: string[] = [];
  const top = topDrivers[0];
  if (!top) return ["Review recent changes to campaign settings."];

  const dim = top.dimension.toLowerCase();
  const name = top.name;

  if (dim === "campaign") {
    suggestions.push(`Pause or restructure campaign "${name}" — it accounts for ${Math.abs(top.contribution).toFixed(0)}% of the ${metric} decline.`);
    suggestions.push(`Review bid strategy and budget allocation for "${name}".`);
    suggestions.push(`Check for audience overlap or creative fatigue in this campaign.`);
  } else if (dim === "geo" || dim === "geography") {
    suggestions.push(`Reduce spend in ${name} or add negative geo-targeting — this region drove ${Math.abs(top.contribution).toFixed(0)}% of the drop.`);
    suggestions.push(`Compare ${name} performance against other regions to find reallocation opportunities.`);
    suggestions.push(`Check if local market conditions or seasonality affected ${name}.`);
  } else if (dim === "device") {
    suggestions.push(`Audit ${name} landing page experience — ${name} performance dropped significantly.`);
    suggestions.push(`Adjust bid modifiers for ${name} to reduce wasted spend.`);
    suggestions.push(`Check page load times and UX on ${name} devices.`);
  } else if (dim === "ad group" || dim === "adgroup") {
    suggestions.push(`Review ad group "${name}" — consider pausing underperformers or refreshing creatives.`);
    suggestions.push(`Check keyword relevance and quality scores in "${name}".`);
    suggestions.push(`Test new ad copy variations in this ad group.`);
  } else {
    suggestions.push(`Investigate "${name}" (${top.dimension}) — it accounts for ${Math.abs(top.contribution).toFixed(0)}% of the ${metric} decline.`);
    suggestions.push(`Compare recent performance of "${name}" against historical benchmarks.`);
    suggestions.push(`Check for external factors or configuration changes affecting "${name}".`);
  }

  return suggestions;
}

export default function RCAPanel({
  isOpen,
  onClose,
  metric,
  currentValue,
  previousValue,
  dimensions,
  currency = "INR",
}: RCAPanelProps) {
  const changePercent = useMemo(() => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  }, [currentValue, previousValue]);

  const sortedDimensions = useMemo(
    () => [...dimensions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    [dimensions]
  );

  const top5 = sortedDimensions.slice(0, 5);

  const chartData = useMemo(
    () =>
      sortedDimensions.map((d) => ({
        name: d.name.length > 20 ? d.name.slice(0, 18) + "\u2026" : d.name,
        fullName: d.name,
        contribution: d.contribution,
        fill: d.contribution < 0 ? "#ef4444" : "#22c55e",
      })),
    [sortedDimensions]
  );

  const suggestions = useMemo(
    () => generateSuggestions(top5, metric),
    [top5, metric]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-border-primary rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-text-primary font-fira-code">
            {"\uD83D\uDD0D"} Investigating {metric} Decline
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Summary */}
          <div className="bg-surface-hover rounded-lg p-4 border border-border-primary">
            <p className="text-text-primary text-sm">
              <span className="font-semibold">{metric}</span> dropped from{" "}
              <span className="text-primary-400 font-mono font-semibold">
                {formatMetricValue(metric, previousValue, currency)}
              </span>{" "}
              to{" "}
              <span className="text-accent-error font-mono font-semibold">
                {formatMetricValue(metric, currentValue, currency)}
              </span>{" "}
              (
              <span className={changePercent < 0 ? "text-accent-error" : "text-accent-success"}>
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(1)}%
              </span>
              )
            </p>
          </div>

          {/* Waterfall Chart */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              Contribution Breakdown
            </h3>
            <div className="bg-surface-hover rounded-lg p-3 border border-border-primary">
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                    domain={["dataMin", "dataMax"]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#d1d5db", fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#f3f4f6",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Contribution"]}
                    labelFormatter={(label: string) => {
                      const item = chartData.find((d) => d.name === label);
                      return item?.fullName ?? label;
                    }}
                  />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="contribution"
                      position="right"
                      formatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                      style={{ fill: "#9ca3af", fontSize: 11, fontFamily: "Fira Code" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Driver List */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              Top Drivers
            </h3>
            <div className="space-y-2">
              {top5.map((d, i) => {
                const dimChange =
                  d.previousValue === 0
                    ? 0
                    : ((d.currentValue - d.previousValue) / Math.abs(d.previousValue)) * 100;
                return (
                  <div
                    key={i}
                    className="bg-surface-hover rounded-lg p-3 border border-border-primary flex items-start gap-3"
                  >
                    <span className="text-lg mt-0.5">{severityIcon(d.contribution)}</span>
                    <div className="min-w-0">
                      <p className="text-text-primary text-sm">
                        {i === 0 ? (
                          <span className="font-semibold text-accent-error">Primary driver: </span>
                        ) : (
                          <span className="text-text-secondary font-medium">#{i + 1}: </span>
                        )}
                        <span className="font-semibold">{d.name}</span>
                        <span className="text-text-tertiary"> — {d.dimension}</span>
                      </p>
                      <p className="text-text-secondary text-xs mt-1">
                        {metric} declined{" "}
                        <span className="text-accent-error font-mono">
                          {dimChange.toFixed(1)}%
                        </span>{" "}
                        (accounts for{" "}
                        <span className="font-mono font-semibold">
                          {Math.abs(d.contribution).toFixed(0)}%
                        </span>{" "}
                        of drop)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Actions */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              Suggested Next Steps
            </h3>
            <div className="bg-surface-hover rounded-lg p-4 border border-border-primary space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-text-primary">
                  <span className="text-primary-400 font-mono mt-0.5">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
