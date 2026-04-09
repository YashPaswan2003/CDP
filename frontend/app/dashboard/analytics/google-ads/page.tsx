"use client";

import { useAccount } from "@/lib/accountContext";
import { usePathname } from "next/navigation";
import { ChartContainer, LineChart } from "@/components";
import { fetchDailyMetrics } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function GoogleAdsAnalytics() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(["spend", "revenue"]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    const loadMetrics = async () => {
      const metrics = await fetchDailyMetrics({ account_id: selectedAccount?.id, platform: "google" });
      setDailyMetrics(metrics);

      // Set default date range (last 30 days)
      if (metrics.length > 0) {
        const lastDate = new Date(metrics[metrics.length - 1].date);
        const firstDate = new Date(metrics[0].date);
        setDateFrom(firstDate.toISOString().split("T")[0]);
        setDateTo(lastDate.toISOString().split("T")[0]);
      }
    };
    loadMetrics();
  }, [selectedAccount?.id]);

  const googleMetrics = dailyMetrics.filter((m) => {
    if (m.platform !== "google") return false;
    if (!dateFrom || !dateTo) return true;
    return m.date >= dateFrom && m.date <= dateTo;
  });

  const allMetricsOptions = [
    { value: "spend", label: "Spend" },
    { value: "revenue", label: "Revenue" },
    { value: "impressions", label: "Impressions" },
    { value: "clicks", label: "Clicks" },
    { value: "conversions", label: "Conversions" },
  ];

  const trendDataKeys = selectedMetrics
    .map((metric) => {
      const labels: Record<string, string> = {
        spend: "Spend",
        revenue: "Revenue",
        impressions: "Impressions",
        clicks: "Clicks",
        conversions: "Conversions",
      };
      const colors: Record<string, string> = {
        spend: "#3B82F6",
        revenue: "#10B981",
        impressions: "#F59E0B",
        clicks: "#8B5CF6",
        conversions: "#EC4899",
      };
      return {
        key: metric,
        name: labels[metric] || metric,
        color: colors[metric] || "#3B82F6",
      };
    })
    .filter((item) => googleMetrics.some((d: any) => d[item.key] !== undefined));

  // Sub-nav tabs
  const subNavItems = [
    { label: "Overview", href: "/dashboard/analytics/google-ads" },
    { label: "Campaigns", href: "/dashboard/analytics/google-ads/campaigns" },
    { label: "Ad Groups", href: "/dashboard/analytics/google-ads/ad-groups" },
    { label: "Keywords", href: "/dashboard/analytics/google-ads/keywords" },
    { label: "SQR", href: "/dashboard/analytics/google-ads/sqr" },
    { label: "Creatives", href: "/dashboard/analytics/google-ads/creatives" },
    { label: "Channels", href: "/dashboard/analytics/google-ads/channels" },
    { label: "Geo", href: "/dashboard/analytics/google-ads/geo" },
    { label: "Demographics", href: "/dashboard/analytics/google-ads/demographics" },
    { label: "Funnel", href: "/dashboard/analytics/google-ads/funnel" },
    { label: "Comparison", href: "/dashboard/analytics/google-ads/comparison" },
    { label: "Reports", href: "/dashboard/analytics/google-ads/reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Google Ads Analytics
        </h1>
        <p className="text-text-secondary">Account: {selectedAccount?.name}</p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 border-b border-border-primary overflow-x-auto">
        {subNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              pathname === item.href
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Metrics Selector and Chart */}
      <ChartContainer title="Performance Trend">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Metrics
            </label>
            <div className="flex flex-wrap gap-2">
              {allMetricsOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedMetrics((prev) =>
                      prev.includes(option.value)
                        ? prev.filter((m) => m !== option.value)
                        : [...prev, option.value]
                    );
                  }}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedMetrics.includes(option.value)
                      ? "bg-primary-500/20 text-primary-400 border border-primary-500"
                      : "bg-slate-800 text-text-secondary border border-slate-700 hover:border-primary-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {googleMetrics.length > 0 && trendDataKeys.length > 0 && (
            <LineChart
              data={googleMetrics}
              dataKeys={trendDataKeys}
              height={300}
            />
          )}
        </div>
      </ChartContainer>

      {/* Dynamic Metric Cards */}
      {googleMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {selectedMetrics.map((metric) => {
            let label = "";
            let value: any = 0;
            let isCurrency = false;

            if (metric === "spend") {
              label = "Total Spend";
              value = googleMetrics.reduce((s, m) => s + m.spend, 0);
              isCurrency = true;
            } else if (metric === "revenue") {
              label = "Total Revenue";
              value = googleMetrics.reduce((s, m) => s + m.revenue, 0);
              isCurrency = true;
            } else if (metric === "impressions") {
              label = "Total Impressions";
              value = googleMetrics.reduce((s, m) => s + m.impressions, 0);
            } else if (metric === "clicks") {
              label = "Total Clicks";
              value = googleMetrics.reduce((s, m) => s + m.clicks, 0);
            } else if (metric === "conversions") {
              label = "Total Conversions";
              value = googleMetrics.reduce((s, m) => s + m.conversions, 0);
            }

            return (
              <div key={metric} className="card">
                <p className="text-text-secondary text-sm mb-2">{label}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {isCurrency
                    ? formatCurrency(value, selectedAccount?.currency)
                    : value.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
