"use client";
import { usePathname } from "next/navigation";
import { useAccount } from "@/lib/accountContext";
import { ChartContainer, EmptyState } from "@/components";
import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";

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

interface FunnelStage {
  impressions: number;
  clicks: number;
  cost: number;
  reach: number;
}

interface FunnelData {
  tofu: FunnelStage;
  mofu: FunnelStage;
  bofu: FunnelStage;
}

export default function GoogleAdsFunnel() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!selectedAccount?.id) {
          setFunnelData(null);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          account_id: selectedAccount.id,
          platform: "google",
        });

        const response = await fetch(`/api/analytics/funnel?${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch funnel data: ${response.status}`);
        }

        const data = await response.json();
        setFunnelData(data.funnel);
      } catch (err) {
        console.error("Error fetching funnel data:", err);
        setError(err instanceof Error ? err.message : "Failed to load funnel data");
        setFunnelData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelData();
  }, [selectedAccount?.id]);

  // Check if we have any data
  const hasData =
    funnelData &&
    (funnelData.tofu.impressions > 0 || funnelData.mofu.impressions > 0 || funnelData.bofu.impressions > 0);

  // Helper function to get stage label and color
  const getStageInfo = (stage: string) => {
    const stageInfo: Record<string, { label: string; color: string }> = {
      tofu: { label: "Awareness (TOFU)", color: "from-blue-500 to-blue-400" },
      mofu: { label: "Consideration (MOFU)", color: "from-purple-500 to-purple-400" },
      bofu: { label: "Conversion (BOFU)", color: "from-amber-500 to-amber-400" },
    };
    return stageInfo[stage] || { label: stage.toUpperCase(), color: "from-gray-500 to-gray-400" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Google Ads - Funnel</h1>
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

      <ChartContainer title="TOFU/MOFU/BOFU Conversion Funnel">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
            <p className="font-medium">Error loading funnel data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && !hasData && (
          <EmptyState
            icon={<BarChart3 size={48} />}
            title="No data yet"
            message="Upload your first campaign report to see funnel metrics here."
            action={{ label: "Upload Data", href: "/dashboard/upload" }}
          />
        )}

        {!loading && !error && hasData && (
          <div className="space-y-8">
            {(["tofu", "mofu", "bofu"] as const).map((stage) => {
              const data = funnelData[stage];
              const info = getStageInfo(stage);
              const ctr = data.clicks > 0 ? ((data.clicks / data.impressions) * 100).toFixed(2) : "0.00";

              return (
                <div key={stage} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-text-primary font-semibold">{info.label}</h3>
                      <p className="text-text-secondary text-sm">
                        {data.impressions.toLocaleString()} impressions, {data.clicks.toLocaleString()} clicks
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-primary font-semibold">₹{data.cost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      <p className="text-text-secondary text-sm">{ctr}% CTR</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-10 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${info.color} h-full flex items-center px-4 transition-all duration-300`}
                      style={{
                        width: `${Math.max(
                          15,
                          funnelData.tofu.impressions > 0 ? (data.impressions / funnelData.tofu.impressions) * 100 : 0
                        )}%`,
                      }}
                    >
                      <span className="text-xs font-semibold text-white whitespace-nowrap">
                        {Math.round(
                          funnelData.tofu.impressions > 0 ? (data.impressions / funnelData.tofu.impressions) * 100 : 0
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartContainer>
    </div>
  );
}
