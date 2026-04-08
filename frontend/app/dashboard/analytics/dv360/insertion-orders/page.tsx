"use client";
import { usePathname } from "next/navigation";
import { useAccount } from "@/lib/accountContext";
import { ChartContainer } from "@/components";
import { getInsertionOrders } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const subNavItems = [
  { label: "Overview", href: "/dashboard/analytics/dv360" },
  { label: "Insertion Orders", href: "/dashboard/analytics/dv360/insertion-orders" },
  { label: "Line Items", href: "/dashboard/analytics/dv360/line-items" },
  { label: "Channels", href: "/dashboard/analytics/dv360/channels" },
  { label: "Placement", href: "/dashboard/analytics/dv360/placement" },
  { label: "Geo", href: "/dashboard/analytics/dv360/geo" },
  { label: "Demographics", href: "/dashboard/analytics/dv360/demographics" },
  { label: "Creatives", href: "/dashboard/analytics/dv360/creatives" },
  { label: "Funnel", href: "/dashboard/analytics/dv360/funnel" },
  { label: "Comparison", href: "/dashboard/analytics/dv360/comparison" },
  { label: "Reports", href: "/dashboard/analytics/dv360/reports" },
];

export default function DV360InsertionOrders() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const data = getInsertionOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">DV360 - Insertion Orders</h1>
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

      <ChartContainer title="Insertion Orders">
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
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Budget</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Spent</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Pacing %</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Impressions</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Clicks</th>
                  <th className="text-right py-2 px-3 font-medium text-text-secondary">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, rowsPerPage).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-text-primary">{row.name}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(row.budget, selectedAccount?.currency)}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(row.spent, selectedAccount?.currency)}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${row.pacingPercent > 100 ? 'text-accent-error' : 'text-accent-success'}`}>
                      {row.pacingPercent}%
                    </td>
                    <td className="py-2 px-3 text-right">{row.impressions.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{row.clicks.toLocaleString()}</td>
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
