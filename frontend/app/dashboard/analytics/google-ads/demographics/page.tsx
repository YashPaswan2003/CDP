"use client";
import { useAccount } from "@/lib/accountContext";
import { usePathname } from "next/navigation";
import { ChartContainer } from "@/components";
import { getDemographicData } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";

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

export default function GoogleAdsDemographics() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const allData = getDemographicData().filter((r) => r.platform === "google");

  const ageData = allData.filter((r) => r.dimension === "age");
  const genderData = allData.filter((r) => r.dimension === "gender");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Google Ads - Demographics</h1>
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

      <ChartContainer title="Age Breakdown">
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 font-medium text-text-secondary">Age Segment</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Impressions</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Clicks</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">CTR</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Spend</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {ageData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-text-primary">{row.segment}</td>
                    <td className="py-2 px-3 text-right">{row.impressions.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{row.clicks.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{((row.clicks / row.impressions) * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(row.spend, selectedAccount?.currency)}</td>
                    <td className="py-2 px-3 text-right">{row.conversions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartContainer>

      <ChartContainer title="Gender Breakdown">
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 font-medium text-text-secondary">Gender</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Impressions</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Clicks</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">CTR</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Spend</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {genderData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-text-primary">{row.segment}</td>
                    <td className="py-2 px-3 text-right">{row.impressions.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{row.clicks.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{((row.clicks / row.impressions) * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(row.spend, selectedAccount?.currency)}</td>
                    <td className="py-2 px-3 text-right">{row.conversions.toLocaleString()}</td>
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
