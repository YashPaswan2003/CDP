"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface DataRow {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  cpc: number;
  ctr: number;
  cvr: number;
  roas: number;
}

interface KPISummaryBarProps {
  data: DataRow[];
  previousData?: DataRow[];
  currency?: string;
  showComparison?: boolean;
}

function aggregate(rows: DataRow[]) {
  const totals = rows.reduce(
    (acc, r) => ({
      spend: acc.spend + r.spend,
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      conversions: acc.conversions + r.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  return {
    spend: totals.spend,
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversions: totals.conversions,
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    cvr: totals.clicks > 0 ? totals.conversions / totals.clicks : 0,
    roas: totals.spend > 0 ? (totals.conversions * 100) / totals.spend : 0,
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function formatCurrencyValue(value: number, currency = "INR"): string {
  if (currency === "INR") {
    return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const METRICS: Array<{
  key: string;
  label: string;
  format: (v: number, currency?: string) => string;
  lowerIsBetter?: boolean;
}> = [
  { key: "spend", label: "Spend", format: (v, c) => formatCurrencyValue(v, c), lowerIsBetter: true },
  { key: "impressions", label: "Impressions", format: (v) => formatNumber(v) },
  { key: "clicks", label: "Clicks", format: (v) => formatNumber(v) },
  { key: "ctr", label: "CTR", format: (v) => (v * 100).toFixed(2) + "%" },
  { key: "cpc", label: "CPC", format: (v, c) => formatCurrencyValue(v, c), lowerIsBetter: true },
  { key: "conversions", label: "Conversions", format: (v) => formatNumber(v) },
  { key: "cvr", label: "CVR", format: (v) => (v * 100).toFixed(2) + "%" },
  { key: "roas", label: "ROAS", format: (v) => v.toFixed(2) + "x" },
];

export default function KPISummaryBar({
  data,
  previousData,
  currency = "INR",
  showComparison = true,
}: KPISummaryBarProps) {
  const current = aggregate(data);
  const previous = previousData ? aggregate(previousData) : null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {METRICS.map((metric) => {
        const value = current[metric.key as keyof typeof current];
        const prevValue = previous
          ? previous[metric.key as keyof typeof previous]
          : null;
        const change =
          showComparison && prevValue != null ? pctChange(value, prevValue) : null;
        const isPositive =
          change != null
            ? metric.lowerIsBetter
              ? change < 0
              : change > 0
            : false;

        return (
          <div
            key={metric.key}
            className="bg-gray-900 border border-gray-800 rounded-xl p-3 min-w-[140px] flex-shrink-0"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {metric.label}
            </p>
            <p className="text-lg font-bold font-mono text-white leading-tight">
              {metric.format(value, currency)}
            </p>
            {change != null && (
              <div className="mt-1 flex items-center gap-0.5">
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {change > 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
