"use client";

import { useAccount } from "@/lib/accountContext";
import { usePathname } from "next/navigation";
import { ChartContainer, LineChart } from "@/components";
import { generateDailyMetrics, getMockCampaigns } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function MetaAnalytics() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(["spend", "clicks"]);

  useEffect(() => {
    setDailyMetrics(generateDailyMetrics());
  }, []);

  const metaMetrics = dailyMetrics.filter((m) => m.platform === "meta");
  const metaCampaigns = getMockCampaigns().filter((c) => c.platform === "meta");

  const allMetricsOptions = [
    { value: "spend", label: "Spend" },
    { value: "impressions", label: "Impressions" },
    { value: "clicks", label: "Clicks" },
    { value: "conversions", label: "Conversions" },
    { value: "revenue", label: "Revenue" },
  ];

  const trendDataKeys = selectedMetrics
    .map((metric) => {
      const labels: Record<string, string> = {
        spend: "Spend",
        impressions: "Impressions",
        clicks: "Clicks",
        conversions: "Conversions",
        revenue: "Revenue",
      };
      const colors: Record<string, string> = {
        spend: "#3B82F6",
        impressions: "#F59E0B",
        clicks: "#8B5CF6",
        conversions: "#EC4899",
        revenue: "#10B981",
      };
      return {
        key: metric,
        name: labels[metric] || metric,
        color: colors[metric] || "#3B82F6",
      };
    })
    .filter((item) => metaMetrics.some((d: any) => d[item.key] !== undefined));

  const subNavItems = [
    { label: "Overview", href: "/dashboard/analytics/meta" },
    { label: "Campaigns", href: "/dashboard/analytics/meta/campaigns" },
    { label: "Ad Sets", href: "/dashboard/analytics/meta/ad-sets" },
    { label: "Ads", href: "/dashboard/analytics/meta/ads" },
    { label: "Placement", href: "/dashboard/analytics/meta/placement" },
    { label: "Geo", href: "/dashboard/analytics/meta/geo" },
    { label: "Demographics", href: "/dashboard/analytics/meta/demographics" },
    { label: "Funnel", href: "/dashboard/analytics/meta/funnel" },
    { label: "Comparison", href: "/dashboard/analytics/meta/comparison" },
    { label: "Reports", href: "/dashboard/analytics/meta/reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Meta Analytics
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

      {/* Metrics Selector and Chart */}
      <ChartContainer title="Performance Trend (30 Days)">
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

          {metaMetrics.length > 0 && trendDataKeys.length > 0 && (
            <LineChart
              data={metaMetrics}
              dataKeys={trendDataKeys}
              height={300}
            />
          )}
        </div>
      </ChartContainer>

      {/* Campaign Summary */}
      <ChartContainer title="Campaigns">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metaCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="card p-4 border-l-4 border-primary-500"
            >
              <p className="font-medium text-text-primary mb-2">{campaign.name}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Impressions:</span>
                  <span className="text-text-primary font-semibold">
                    {campaign.impressions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Spend:</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(campaign.spent, selectedAccount?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">ROAS:</span>
                  <span className="text-text-primary font-semibold">
                    {campaign.roas.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">CVR:</span>
                  <span className="text-text-primary font-semibold">
                    {campaign.cvr.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );
}
