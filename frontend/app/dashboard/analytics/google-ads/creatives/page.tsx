"use client";
import { useAccount } from "@/lib/accountContext";
import { usePathname } from "next/navigation";
import { ChartContainer } from "@/components";
import { getCreatives } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

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

export default function GoogleAdsCreatives() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const data = getCreatives().filter((c) => c.platform === "google");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Google Ads - Creatives</h1>
        <p className="text-text-secondary">Account: {selectedAccount?.name}</p>
      </div>

      <div className="flex gap-2 border-b border-border-primary overflow-x-auto">
        {subNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              pathname === item.href ? "border-primary-500 text-primary-400" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>

      <ChartContainer title="Creatives">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-secondary">Showing {Math.min(rowsPerPage, data.length)} of {data.length}</p>
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
                  <th className="text-left py-2 px-3 font-medium text-text-secondary">Format</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Impressions</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Clicks</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Conversions</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Spend</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, rowsPerPage).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-text-primary">{row.creativeName}</td>
                    <td className="py-2 px-3 text-text-secondary">{row.format}</td>
                    <td className="py-2 px-3 text-right">{row.impressions.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{row.clicks.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{row.conversions.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(row.spend, selectedAccount?.currency)}</td>
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
