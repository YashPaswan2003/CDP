"use client";
import { usePathname } from "next/navigation";
import { useAccount } from "@/lib/accountContext";
import { ChartContainer } from "@/components";
import { getCreatives } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

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

export default function MetaAds() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const creatives = getCreatives().filter((c) => c.platform === "meta");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Meta - Ads</h1>
        <p className="text-text-secondary">Account: {selectedAccount?.name}</p>
      </div>

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

      <ChartContainer title="Ads">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-secondary">
              Showing {Math.min(rowsPerPage, creatives.length)} of {creatives.length} ads
            </p>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
            >
              {[10, 25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n} rows</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 font-medium text-text-secondary">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-text-secondary">Type</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Impressions</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Clicks</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">CTR</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Spend</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {creatives.slice(0, rowsPerPage).map((creative) => (
                  <tr key={creative.creativeId} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-text-primary">{creative.creativeName}</td>
                    <td className="py-2 px-3 text-text-secondary text-xs capitalize">{creative.format}</td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {creative.impressions.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {creative.clicks.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {(creative.ctr * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {formatCurrency(creative.spend, selectedAccount?.currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {creative.conversions.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}
