"use client";

import { useAccount } from "@/lib/accountContext";
import { usePathname } from "next/navigation";
import { ChartContainer } from "@/components";
import { fetchAdGroups } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function GoogleAdsAdGroups() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [adGroups, setAdGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const loadAdGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAdGroups({
          account_id: selectedAccount?.id
        });
        setAdGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ad groups");
        setAdGroups([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedAccount?.id) {
      loadAdGroups();
    }
  }, [selectedAccount?.id]);

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
          Google Ads - Ad Groups
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

      {/* Loading / Error States */}
      {loading && (
        <div className="text-center py-8 text-text-secondary">Loading ad groups...</div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 text-red-400 mb-4">
          Error: {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
      <ChartContainer title="Ad Groups">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-secondary">
              Showing {Math.min(rowsPerPage, adGroups.length)} of {adGroups.length} ad groups
            </p>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:border-primary-500"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={200}>200 rows</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 font-medium text-text-secondary">Name</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Impressions</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Clicks</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">CTR</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">CPC</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Spend</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Conv</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">CVR</th>
                </tr>
              </thead>
              <tbody>
                {adGroups.slice(0, rowsPerPage).map((ag) => (
                  <tr key={ag.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-text-primary">{ag.name}</td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {ag.impressions.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {ag.clicks.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {ag.ctr.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {formatCurrency(ag.cpc, selectedAccount?.currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {formatCurrency(ag.spend, selectedAccount?.currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {ag.conversions.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {ag.cvr.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartContainer>
      )}
    </div>
  );
}
