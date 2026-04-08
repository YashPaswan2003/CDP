"use client";
import { usePathname } from "next/navigation";
import { useAccount } from "@/lib/accountContext";
import { ChartContainer } from "@/components";
import { getPeriodComparisons } from "@/lib/mockData";

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

export default function MetaComparison() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const { month } = getPeriodComparisons();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Meta - Comparison</h1>
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

      <ChartContainer title="Period Comparison (Month-over-Month)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 font-medium text-text-secondary">Metric</th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">Previous Month</th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">Current Month</th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">Δ Absolute</th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">Δ %</th>
              </tr>
            </thead>
            <tbody>
              {month.map((row, idx) => {
                const delta = row.currentValue - row.previousValue;
                const isPositive = delta >= 0;
                return (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-text-primary">{row.metric}</td>
                    <td className="py-2 px-3 text-right text-text-primary">{row.previousValue.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-text-primary">{row.currentValue.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${isPositive ? 'text-accent-success' : 'text-accent-error'}`}>
                      {isPositive ? '+' : ''}{delta.toLocaleString()}
                    </td>
                    <td className={`py-2 px-3 text-right font-semibold ${isPositive ? 'text-accent-success' : 'text-accent-error'}`}>
                      {isPositive ? '+' : ''}{row.changePercent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
}
