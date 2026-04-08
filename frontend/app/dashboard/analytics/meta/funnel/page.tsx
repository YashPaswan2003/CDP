"use client";
import { usePathname } from "next/navigation";
import { useAccount } from "@/lib/accountContext";
import { ChartContainer } from "@/components";
import { getFunnelData } from "@/lib/mockData";
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

export default function MetaFunnel() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [funnelMode, setFunnelMode] = useState<"web" | "app">(selectedAccount?.clientType ?? "web");

  const stages = getFunnelData("meta", funnelMode);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Meta - Funnel</h1>
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

      <ChartContainer title="Conversion Funnel">
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFunnelMode("web")}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                funnelMode === "web"
                  ? "bg-primary-500 text-white"
                  : "bg-slate-800 text-text-secondary hover:text-text-primary"
              }`}
            >
              Web
            </button>
            <button
              onClick={() => setFunnelMode("app")}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                funnelMode === "app"
                  ? "bg-primary-500 text-white"
                  : "bg-slate-800 text-text-secondary hover:text-text-primary"
              }`}
            >
              App
            </button>
          </div>
          {stages.map((stage, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-text-primary font-medium">{stage.stage}</span>
                <span className="text-text-secondary text-sm">
                  {stage.value.toLocaleString()} {idx > 0 && `(-${stage.dropoffPercent}%)`}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-8 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-400 h-full flex items-center px-3"
                  style={{ width: `${Math.max(10, (stage.value / stages[0].value) * 100)}%` }}
                >
                  <span className="text-xs font-semibold text-white">{Math.round((stage.value / stages[0].value) * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );
}
