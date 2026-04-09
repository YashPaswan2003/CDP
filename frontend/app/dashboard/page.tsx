"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { dashboardAPI, fetchDailyMetrics } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAccount } from "@/lib/accountContext";
import { ChartContainer } from "@/components";
import LineChart from "@/components/charts/LineChart";
import { ChevronDown } from "lucide-react";

interface PlatformMetrics {
  platform: "google" | "dv360" | "meta";
  name: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  views?: number;
  reach?: number;
}

interface FunnelSectionProps {
  title: string;
  stage: "tofu" | "mofu" | "bofu";
  metrics: Record<string, number | string>;
  insight: string;
  platformCards: PlatformMetrics[];
}

// Brand color fallbacks - these will be overridden by CSS variables in layout.tsx
const BRAND_FALLBACKS = {
  primary: "#EC1D24",   // Kotak red
  secondary: "#003087", // Kotak navy
  accent: "#FFB81C",    // Kotak gold
};

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1E2433] rounded-xl p-4 space-y-1 min-w-0">
      <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium truncate">{label}</p>
      <p className="text-xl font-bold text-white truncate">{value}</p>
    </div>
  );
}

function PlatformSubCard({ platform, metrics, accentColor }: {
  platform: string;
  metrics: { label: string; value: string }[];
  accentColor: string;
}) {
  return (
    <div className="bg-[#1E2433] rounded-xl p-5 flex-1">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-white font-semibold text-sm">{platform}</h4>
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>
      {metrics.map(m => (
        <div key={m.label} className="flex justify-between py-1.5 border-b border-[#2A3144] last:border-0">
          <span className="text-[#6B7280] text-sm">{m.label}</span>
          <span className="text-white text-sm font-medium">{m.value}</span>
        </div>
      ))}
    </div>
  );
}

const stageConfig = {
  tofu: {
    color: "var(--client-primary)",
    hex: BRAND_FALLBACKS.primary,
    label: "🎯 Top of Funnel",
    title: "Awareness",
    description: "Audience reach and impressions",
  },
  mofu: {
    color: "var(--client-secondary)",
    hex: BRAND_FALLBACKS.secondary,
    label: "🔄 Middle of Funnel",
    title: "Consideration",
    description: "Clicks and engagement",
  },
  bofu: {
    color: "var(--client-accent)",
    hex: BRAND_FALLBACKS.accent,
    label: "🎬 Bottom of Funnel",
    title: "Conversion",
    description: "Conversions and revenue",
  },
};

function FunnelPipeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="flex items-center justify-between py-8 px-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
    >
      {Object.entries(stageConfig).map(([stage, config], idx) => (
        <div key={stage} className="flex items-center flex-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div
              style={{ backgroundColor: config.hex }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2"
            >
              {idx + 1}
            </div>
            <p className="text-sm font-semibold text-white">{config.title}</p>
            <p className="text-xs text-slate-400 mt-1">{config.description}</p>
          </motion.div>

          {idx < 2 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="flex-1 h-1 mx-4"
              style={{
                background: `linear-gradient(to right, ${config.hex}, ${Object.values(stageConfig)[idx + 1].hex})`,
                transformOrigin: "left",
              }}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}

function FunnelSection({
  title,
  stage,
  metrics,
  insight,
  platformCards,
}: FunnelSectionProps) {
  // Get accent color based on stage
  const accentColor = stage === "tofu" ? "#EF4444" : stage === "mofu" ? "#3B82F6" : "#F59E0B";

  // Build platform sub-cards data based on stage
  const getPlatformMetrics = (platform: string) => {
    const metrics = platformCards.find(p => p.platform === platform);
    if (!metrics) return [];

    if (stage === "tofu") {
      return [
        { label: "Impressions", value: (metrics.impressions / 1000000).toFixed(1) + "M" },
        { label: "Reach", value: (metrics.reach ? (metrics.reach / 1000000).toFixed(1) : "N/A") + "M" }
      ];
    } else if (stage === "mofu") {
      return [
        { label: "Clicks", value: (metrics.clicks / 1000).toFixed(0) + "K" },
        { label: "CTR", value: ((metrics.clicks / metrics.impressions) * 100).toFixed(2) + "%" }
      ];
    } else {
      return [
        { label: "Conversions", value: (metrics.conversions / 1000).toFixed(1) + "K" },
        { label: "Revenue", value: formatCurrency(metrics.revenue, "INR") }
      ];
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-[#6B7280] text-sm">{insight}</p>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(metrics).slice(0, 4).map(([key, value]) => (
          <MetricCard key={key} label={key} value={String(value)} />
        ))}
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(metrics).slice(4, 8).map(([key, value]) => (
          <MetricCard key={key} label={key} value={String(value)} />
        ))}
        {Object.entries(metrics).slice(8).length > 0 ? (
          Object.entries(metrics).slice(8).map(([key, value]) => (
            <MetricCard key={key} label={key} value={String(value)} />
          ))
        ) : (
          <>
            {[...Array(Math.max(0, 4 - Object.entries(metrics).slice(4).length))].map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Platform Sub-Cards */}
      <div className="flex gap-3">
        {platformCards.filter(p => p.isActive).map((platform) => (
          <PlatformSubCard
            key={platform.platform}
            platform={platform.name}
            metrics={getPlatformMetrics(platform.platform)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function PortfolioPage() {
  const { selectedAccount } = useAccount();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);

  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState({ month: 4, year: 2026 }); // April 2026
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Performance trend controls
  const [trendStage, setTrendStage] = useState<"all" | "tofu" | "mofu" | "bofu">("all");
  const [trendPlatform, setTrendPlatform] = useState<"all" | "google" | "dv360" | "meta">("all");
  const [trendMetrics, setTrendMetrics] = useState<string[]>(["spend", "revenue"]);

  // Get month range
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const monthFrom = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-01`;
  const monthTo = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-${daysInMonth(selectedMonth.month, selectedMonth.year)}`;
  const monthLabel = `${monthNames[selectedMonth.month - 1]} ${selectedMonth.year}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getMetrics(selectedAccount?.id || "");
        setData(response.data);
        const metrics = await fetchDailyMetrics({ account_id: selectedAccount?.id });
        setDailyMetrics(metrics);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedAccount) {
      fetchData();
    }
  }, [selectedAccount]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-slate-400 py-12"
      >
        Loading dashboard...
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-slate-400 py-12"
      >
        No data available
      </motion.div>
    );
  }

  // Calculate platform metrics
  const platformMetrics: Record<string, PlatformMetrics> = {
    google: {
      platform: "google",
      name: "Google Ads",
      isActive: selectedAccount?.platforms?.includes("google") ?? true,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
      views: 0,
    },
    dv360: {
      platform: "dv360",
      name: "DV360",
      isActive: selectedAccount?.platforms?.includes("dv360") ?? true,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
      views: 0,
    },
    meta: {
      platform: "meta",
      name: "Meta",
      isActive: selectedAccount?.platforms?.includes("meta") ?? true,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
      reach: 0,
    },
  };

  // Aggregate by platform
  data.campaigns.forEach((campaign: any) => {
    const platform = campaign.platform.toLowerCase();
    if (platformMetrics[platform]) {
      platformMetrics[platform].impressions += campaign.total_impressions || 0;
      platformMetrics[platform].clicks += campaign.total_clicks || 0;
      platformMetrics[platform].spend += campaign.total_spend || 0;
      platformMetrics[platform].conversions += campaign.total_conversions || 0;
      platformMetrics[platform].revenue += campaign.total_revenue || 0;
      if (platform !== "meta" && campaign.total_views) {
        platformMetrics[platform].views! += campaign.total_views;
      }
    }
  });

  if (platformMetrics.meta) {
    platformMetrics.meta.reach = Math.round(platformMetrics.meta.impressions * 0.7);
  }

  // Enhanced metric calculations
  const totalViews = data.total_views || 0;
  const totalDV360Reach = data.byPlatform?.dv360?.reach || 0;
  const totalMetaReach = data.byPlatform?.meta?.reach || 0;
  const totalReach = totalDV360Reach + totalMetaReach;
  const avgFrequency = totalReach > 0 ? (data.total_impressions / totalReach).toFixed(2) : "0";

  // TOFU metrics (8 chips)
  const completeViews = Math.round(totalViews * 0.35); // synthetic complete view count
  const cpv = completeViews > 0 ? data.total_spend / completeViews : 0;
  const vtr = totalViews > 0 ? (completeViews / totalViews * 100) : 0;

  const tofuMetrics = {
    "Total Impressions": (data.total_impressions / 1000000).toFixed(1) + "M",
    "Complete Views": (completeViews / 1000000).toFixed(1) + "M",
    CPV: formatCurrency(cpv, "INR"),
    "VTR": vtr.toFixed(2) + "%",
    "Google Impr.": (platformMetrics.google.impressions / 1000000).toFixed(1) + "M",
    "DV360 Reach": (totalDV360Reach / 1000000).toFixed(1) + "M",
    "Meta Reach": (totalMetaReach / 1000000).toFixed(1) + "M",
    "Avg Frequency": avgFrequency + "x",
  };

  // MOFU metrics (6 chips)
  const totalClicks = data.total_clicks;
  const totalImpressions = data.total_impressions;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
  const googleMetrics = data.byPlatform?.google || {};
  const dv360Metrics = data.byPlatform?.dv360 || {};
  const metaMetrics = data.byPlatform?.meta || {};
  const googleCTR = googleMetrics.impressions > 0 ? ((googleMetrics.clicks / googleMetrics.impressions) * 100).toFixed(2) : "0";
  const dv360CTR = dv360Metrics.impressions > 0 ? ((dv360Metrics.clicks / dv360Metrics.impressions) * 100).toFixed(2) : "0";
  const metaCTR = metaMetrics.impressions > 0 ? ((metaMetrics.clicks / metaMetrics.impressions) * 100).toFixed(2) : "0";

  const mofuMetrics = {
    "Total Clicks": (totalClicks / 1000).toFixed(0) + "K",
    CTR: ctr + "%",
    "Avg CPC": formatCurrency(data.total_spend / (totalClicks || 1), "INR"),
    "Google CTR": googleCTR + "%",
    "DV360 CTR": dv360CTR + "%",
    "Meta CTR": metaCTR + "%",
  };

  // BOFU metrics (6 chips)
  const totalConversions = data.total_conversions;
  const totalRevenue = data.total_revenue;
  const cvr = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0";
  const roas = data.total_spend > 0 ? (totalRevenue / data.total_spend).toFixed(2) : "0";
  const cpa = totalConversions > 0 ? formatCurrency(data.total_spend / totalConversions, "INR") : "N/A";

  const bofuMetrics = {
    Conversions: (totalConversions / 1000).toFixed(1) + "K",
    Revenue: formatCurrency(totalRevenue, "INR"),
    ROAS: roas + "x",
    CVR: cvr + "%",
    CPA: cpa,
    "Best Platform": "Google Ads",
  };

  // Generate insights
  const topPlatformByImpressions = Object.entries(platformMetrics)
    .filter(([_, p]) => p.isActive)
    .sort(([_, a], [__, b]) => b.impressions - a.impressions)[0];

  const topPlatformByRoas = Object.entries(platformMetrics)
    .filter(([_, p]) => p.isActive)
    .sort(([_, a], [__, b]) => (b.revenue / b.spend || 0) - (a.revenue / a.spend || 0))[0];

  const tofuInsight = topPlatformByImpressions
    ? `${topPlatformByImpressions[1].name} driving ${Math.round(
        (topPlatformByImpressions[1].impressions / data.total_impressions) * 100
      )}% of impressions`
    : "Analyzing audience reach";

  const mofuInsight = data.total_clicks > 0
    ? `Overall CTR at ${((totalClicks / totalImpressions) * 100).toFixed(2)}% across ${Object.values(platformMetrics).filter((p) => p.isActive).length} platforms`
    : "Tracking engagement";

  const bofuInsight = topPlatformByRoas
    ? `${topPlatformByRoas[1].name} delivering ${(topPlatformByRoas[1].revenue / topPlatformByRoas[1].spend).toFixed(2)}x ROAS`
    : "Optimizing conversions";

  // Filter daily metrics by month and platform
  const filteredDailyMetrics = dailyMetrics.filter((m: any) => {
    const inMonth = m.date >= monthFrom && m.date <= monthTo;
    const inPlatform = trendPlatform === "all" || m.platform === trendPlatform;
    return inMonth && inPlatform;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            {/* Client Logo Badge */}
            <div
              style={{
                background: `linear-gradient(135deg, ${selectedAccount?.brandColors?.primary || BRAND_FALLBACKS.primary}, ${selectedAccount?.brandColors?.secondary || BRAND_FALLBACKS.secondary})`,
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            >
              {selectedAccount?.name?.split(" ").map((w) => w[0]).join("")}
            </div>
            <h1 className="text-4xl font-bold text-white">{selectedAccount?.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-slate-400 ml-13">
            <span>{formatCurrency(data.total_spend, selectedAccount?.currency)} spent</span>
            <span>•</span>
            {/* Month Picker Button */}
            <div className="relative">
              <motion.button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
              >
                <span>{monthLabel}</span>
                <ChevronDown className="w-4 h-4" />
              </motion.button>

              {/* Month Picker Dropdown */}
              {showMonthPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 w-48"
                >
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {monthNames.map((month, idx) => (
                      <motion.button
                        key={month}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                          setSelectedMonth({ month: idx + 1, year: 2026 });
                          setShowMonthPicker(false);
                        }}
                        className={`px-2 py-1 rounded text-sm font-medium transition-all ${
                          selectedMonth.month === idx + 1
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {month.slice(0, 3)}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowMonthPicker(false)}
                    className="w-full px-3 py-1 rounded text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Funnel Pipeline */}
      <FunnelPipeline />

      {/* TOFU Section */}
      <FunnelSection
        title="Top of Funnel — Awareness"
        stage="tofu"
        metrics={tofuMetrics}
        insight={tofuInsight}
        platformCards={Object.values(platformMetrics)}
      />

      {/* MOFU Section */}
      <FunnelSection
        title="Middle of Funnel — Consideration"
        stage="mofu"
        metrics={mofuMetrics}
        insight={mofuInsight}
        platformCards={Object.values(platformMetrics)}
      />

      {/* BOFU Section */}
      <FunnelSection
        title="Bottom of Funnel — Conversion"
        stage="bofu"
        metrics={bofuMetrics}
        insight={bofuInsight}
        platformCards={Object.values(platformMetrics)}
      />

      {/* Performance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Performance Trend</h3>
          <p className="text-sm text-slate-400">Month: {monthLabel}</p>
        </div>

        {/* Stage Tabs */}
        <motion.div className="flex gap-2 flex-wrap">
          {(["all", "tofu", "mofu", "bofu"] as const).map((stage) => (
            <motion.button
              key={stage}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTrendStage(stage)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                trendStage === stage
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {stage === "all" ? "All Stages" : stage.toUpperCase()}
            </motion.button>
          ))}
        </motion.div>

        {/* Platform Tabs */}
        <motion.div className="flex gap-2 flex-wrap">
          {(["all", "google", "dv360", "meta"] as const).map((platform) => (
            <motion.button
              key={platform}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTrendPlatform(platform)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                trendPlatform === platform
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {platform === "all" ? "All Platforms" : platform === "dv360" ? "DV360" : platform.charAt(0).toUpperCase() + platform.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Metric Selector */}
        <motion.div className="flex gap-2 flex-wrap">
          {["spend", "revenue", "impressions", "clicks", "conversions"].map((metric) => (
            <motion.button
              key={metric}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTrendMetrics((prev) =>
                  prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
                );
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                trendMetrics.includes(metric)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Chart Container */}
        <ChartContainer title="Metrics Over Time">
          {filteredDailyMetrics.length > 0 ? (
            <LineChart
              data={filteredDailyMetrics}
              dataKeys={[
                { key: "spend", name: "Spend", color: "#3B82F6" },
                { key: "revenue", name: "Revenue", color: "#10B981" },
                { key: "impressions", name: "Impressions", color: "#F59E0B" },
                { key: "clicks", name: "Clicks", color: "#8B5CF6" },
                { key: "conversions", name: "Conversions", color: "#EC4899" },
              ].filter((dk) => trendMetrics.includes(dk.key))}
              height={300}
            />
          ) : (
            <p className="text-center text-slate-400 py-8">No data for selected filters</p>
          )}
        </ChartContainer>
      </motion.div>
    </motion.div>
  );
}
