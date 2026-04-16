"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { dashboardAPI, fetchDailyMetrics, fetchAlerts } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAccount } from "@/lib/accountContext";
import { ChartContainer } from "@/components";
import LineChart from "@/components/charts/LineChart";
import { AlertStrip, type Alert } from "@/components/monitor/AlertStrip";
import { RecommendationPanel, type Recommendation } from "@/components/ai/RecommendationPanel";
import { getMockRecommendations } from "@/lib/mockData";
import { HEALTH_THRESHOLDS } from "@/components/metrics/HealthDot";
import { MonitorDiagnoseAct } from "@/components/MonitorDiagnoseAct";
import { getConfig } from "@/lib/api";
import { ChevronDown, Settings, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

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

interface MetricWithHealth {
  value: string;
  current: number;
  previous: number;
}

interface FunnelMetrics {
  [key: string]: MetricWithHealth;
}

interface FunnelSectionProps {
  title: string;
  stage: "tofu" | "mofu" | "bofu";
  metrics: FunnelMetrics;
  insight?: string;
  platformCards: PlatformMetrics[];
  selectedAccount?: any;
  monthFrom: string;
  monthTo: string;
}

// Brand color fallbacks - these will be overridden by CSS variables in layout.tsx
const BRAND_FALLBACKS = {
  primary: "#5C6BC0",   // Amplitude indigo
  secondary: "#4338CA", // Amplitude deep indigo
  accent: "#F59E0B",    // Amplitude amber
};

/**
 * Helper to create metric objects with health data
 * Scenarios: -30%, -15%, +20% for realistic variety
 * Uses HEALTH_THRESHOLDS to maintain consistent threshold values
 */
function createMetric(value: string, rawValue: number, healthVariation: number = HEALTH_THRESHOLDS.WARNING_THRESHOLD): MetricWithHealth {
  const previous = Math.max(0, rawValue / (1 + healthVariation));
  return {
    value,
    current: rawValue,
    previous,
  };
}


function PlatformSubCard({
  platform,
  accentColor,
  analyzeUrl,
}: {
  platform: string;
  metrics?: { label: string; value: string }[];
  accentColor: string;
  analyzeUrl: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated flex-1">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="text-xs font-semibold text-text-primary">{platform}</span>
      </div>
      <a
        href={analyzeUrl}
        className="text-[11px] font-bold uppercase tracking-wide transition-colors hover:opacity-80"
        style={{ color: accentColor }}
      >
        Analyze
      </a>
    </div>
  );
}



function FunnelSection({
  title,
  stage,
  metrics,
  insight: _insight,
  platformCards,
  selectedAccount,
  monthFrom,
  monthTo,
}: FunnelSectionProps) {
  // Get accent color based on stage
  const accentColor = stage === "tofu" ? "#5C6BC0" : stage === "mofu" ? "#7986CB" : "#F59E0B";

  // Build platform sub-cards data based on stage — expanded metrics per platform
  const getPlatformMetrics = (platform: string) => {
    const m = platformCards.find(p => p.platform === platform);
    if (!m) return [];

    // Helper formatters
    const fmtAbbr = (v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v >= 1_000 ? (v / 1_000).toFixed(0) + "K" : v.toFixed(0);
    const fmtCur = (v: number) => formatCurrency(v, "INR");
    const fmtPct = (v: number) => v.toFixed(2) + "%";

    const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
    const cpc = m.clicks > 0 ? m.spend / m.clicks : 0;
    const cpm = m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0;
    const roas = m.spend > 0 ? m.revenue / m.spend : 0;
    const cpa = m.conversions > 0 ? m.spend / m.conversions : 0;
    const vtr = (m.views && m.impressions > 0) ? (m.views / m.impressions) * 100 : 0;
    const cpv = (m.views && m.views > 0) ? m.spend / m.views : 0;

    if (stage === "tofu") {
      if (platform === "google") {
        return [
          { label: "Impressions", value: fmtAbbr(m.impressions) },
          { label: "Views", value: fmtAbbr(m.views || 0) },
          { label: "CPM", value: fmtCur(cpm) },
          { label: "VTR", value: fmtPct(vtr) },
        ];
      } else if (platform === "dv360") {
        return [
          { label: "Impressions", value: fmtAbbr(m.impressions) },
          { label: "Reach", value: m.reach ? fmtAbbr(m.reach) : "—" },
          { label: "Views", value: fmtAbbr(m.views || 0) },
          { label: "CPV", value: fmtCur(cpv) },
        ];
      } else {
        // meta
        return [
          { label: "Impressions", value: fmtAbbr(m.impressions) },
          { label: "Reach", value: m.reach ? fmtAbbr(m.reach) : "—" },
          { label: "Frequency", value: m.reach && m.reach > 0 ? (m.impressions / m.reach).toFixed(2) + "x" : "—" },
          { label: "CPM", value: fmtCur(cpm) },
        ];
      }
    } else if (stage === "mofu") {
      // All platforms: Clicks, CTR, CPC
      return [
        { label: "Clicks", value: fmtAbbr(m.clicks) },
        { label: "CTR", value: fmtPct(ctr) },
        { label: "CPC", value: fmtCur(cpc) },
      ];
    } else {
      // BOFU
      if (platform === "google") {
        return [
          { label: "Conversions", value: fmtAbbr(m.conversions) },
          { label: "Revenue", value: fmtCur(m.revenue) },
          { label: "ROAS", value: roas.toFixed(2) + "x" },
          { label: "CPA", value: fmtCur(cpa) },
        ];
      } else if (platform === "dv360") {
        return [
          { label: "Conversions", value: fmtAbbr(m.conversions) },
          { label: "Revenue", value: fmtCur(m.revenue) },
          { label: "ROAS", value: roas.toFixed(2) + "x" },
        ];
      } else {
        // meta
        return [
          { label: "Conversions", value: fmtAbbr(m.conversions) },
          { label: "Revenue", value: fmtCur(m.revenue) },
          { label: "ROAS", value: roas.toFixed(2) + "x" },
          { label: "CPA", value: fmtCur(cpa) },
        ];
      }
    }
  };

  // Build analyze URLs for each platform with stage context
  const getAnalyzeUrl = (platformId: "google" | "dv360" | "meta") => {
    const basePath = platformId === "google" ? "/dashboard/analytics/google-ads" :
                     platformId === "dv360" ? "/dashboard/analytics/dv360" :
                     "/dashboard/analytics/meta";
    const params = new URLSearchParams();
    params.set("stage", stage);
    if (selectedAccount?.id) params.set("account_id", selectedAccount.id);
    if (monthFrom) params.set("date_from", monthFrom);
    if (monthTo) params.set("date_to", monthTo);
    return `${basePath}?${params.toString()}`;
  };

  // Phase number based on stage
  const phaseNum = stage === "tofu" ? "01" : stage === "mofu" ? "02" : "03";
  const phaseLabel = stage === "tofu" ? "Top of Funnel" : stage === "mofu" ? "Mid of Funnel" : "Bottom of Funnel";
  const indent = stage === "tofu" ? "" : stage === "mofu" ? "ml-8" : "ml-16";
  const borderColor = stage === "tofu" ? "" : stage === "mofu" ? "border-l-4 border-secondary-500" : "border-l-4 border-primary-500";

  // Pick top 3 metrics for inline display
  const topMetrics = Object.entries(metrics).slice(0, 3);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`${indent}`}
    >
      <div className={`bg-surface-base rounded-xl p-6 border border-border-primary transition-all hover:shadow-md ${borderColor}`}>
        <div className="flex gap-8">
          {/* Stage Label */}
          <div className="w-40 flex flex-col justify-center flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>Phase {phaseNum}</span>
            <h3 className="text-lg font-bold text-text-primary">{title.split(" — ")[1] || title}</h3>
            <p className="text-xs text-text-secondary">{phaseLabel}</p>
          </div>

          {/* Inline Metrics */}
          <div className="flex-1 grid grid-cols-3 gap-4 border-l border-border-primary pl-8">
            {topMetrics.map(([key, metric]) => {
              const hasChange = metric.current !== undefined && metric.previous !== undefined && metric.previous > 0;
              const changePct = hasChange ? ((metric.current - metric.previous) / metric.previous) * 100 : 0;
              const isPositive = changePct >= 0;

              return (
                <div key={key}>
                  <div className="text-[11px] text-text-secondary mb-1">{key}</div>
                  <div className="text-2xl font-bold text-text-primary">{metric.value}</div>
                  {hasChange && Math.abs(changePct) > 0.5 && (
                    <div className={`text-[11px] flex items-center gap-1 font-medium ${isPositive ? "text-accent-success" : "text-accent-error"}`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? "+" : ""}{changePct.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Row */}
        <div className="mt-6 pt-6 border-t border-border-primary grid grid-cols-3 gap-4">
          {platformCards.filter(p => p.isActive).map((platform) => (
            <PlatformSubCard
              key={platform.platform}
              platform={platform.name}
              metrics={getPlatformMetrics(platform.platform)}
              accentColor={accentColor}
              analyzeUrl={getAnalyzeUrl(platform.platform as "google" | "dv360" | "meta")}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function PortfolioPage() {
  const { selectedAccount } = useAccount();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [configNeeded, setConfigNeeded] = useState(false);

  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState({ month: 4, year: 2026 }); // April 2026
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Trend days selector (7/30/90)
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);

  // Performance trend controls
  const [trendStage, setTrendStage] = useState<"all" | "tofu" | "mofu" | "bofu">("all");
  const [trendPlatform, setTrendPlatform] = useState<"all" | "google" | "dv360" | "meta">("all");
  const [trendMetrics, setTrendMetrics] = useState<string[]>(["spend", "revenue"]);
  const [trendCampaign, setTrendCampaign] = useState<string>("all");

  // Get month range
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const monthFrom = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-01`;
  const monthTo = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-${daysInMonth(selectedMonth.month, selectedMonth.year)}`;
  const monthLabel = `${monthNames[selectedMonth.month - 1]} ${selectedMonth.year}`;

  // Check if config is set up
  useEffect(() => {
    const checkConfig = async () => {
      if (!selectedAccount?.id) return;
      try {
        const config = await getConfig(selectedAccount.id);
        setConfigNeeded(!config.is_configured);
      } catch {
        setConfigNeeded(false);
      }
    };
    checkConfig();
  }, [selectedAccount?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getMetrics(selectedAccount?.id || "");
        setData(response.data);
        const metrics = await fetchDailyMetrics({ account_id: selectedAccount?.id });
        setDailyMetrics(metrics);
        const accountAlerts = await fetchAlerts({ account_id: selectedAccount?.id });
        setAlerts(accountAlerts);
        // Load mock recommendations
        const mockRecs = getMockRecommendations();
        setRecommendations(mockRecs);
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
        className="text-center text-text-secondary py-12"
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
        className="text-center text-text-secondary py-12"
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
  const vtr = totalViews > 0 ? ((completeViews / totalViews) * 100) : 0;

  // Create metric objects with health data (different scenarios for variety)
  const tofuMetrics: FunnelMetrics = {
    "Total Impressions": createMetric((data.total_impressions / 1000000).toFixed(1) + "M", data.total_impressions, -0.30), // 30% decline
    "Complete Views": createMetric((completeViews / 1000000).toFixed(1) + "M", completeViews, -0.15), // 15% decline
    CPV: createMetric(formatCurrency(cpv, "INR"), cpv, 0.20), // 20% growth
    "VTR": createMetric(vtr.toFixed(2) + "%", vtr, -0.12), // 12% decline
    "Google Impr.": createMetric((platformMetrics.google.impressions / 1000000).toFixed(1) + "M", platformMetrics.google.impressions, -0.25), // 25% decline
    "DV360 Reach": createMetric((totalDV360Reach / 1000000).toFixed(1) + "M", totalDV360Reach, 0.10), // 10% growth
    "Meta Reach": createMetric((totalMetaReach / 1000000).toFixed(1) + "M", totalMetaReach, -0.08), // 8% decline (on track)
    "Avg Frequency": createMetric(avgFrequency + "x", parseFloat(avgFrequency), 0.05), // 5% growth
  };

  // MOFU metrics (6 chips)
  const totalClicks = data.total_clicks;
  const totalImpressions = data.total_impressions;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
  const avgCPC = totalClicks > 0 ? data.total_spend / totalClicks : 0;
  const googleMetrics = data.byPlatform?.google || {};
  const dv360Metrics = data.byPlatform?.dv360 || {};
  const metaMetrics = data.byPlatform?.meta || {};
  const googleCTRValue = googleMetrics.impressions > 0 ? (googleMetrics.clicks / googleMetrics.impressions) * 100 : 0;
  const dv360CTRValue = dv360Metrics.impressions > 0 ? (dv360Metrics.clicks / dv360Metrics.impressions) * 100 : 0;
  const metaCTRValue = metaMetrics.impressions > 0 ? (metaMetrics.clicks / metaMetrics.impressions) * 100 : 0;

  const mofuMetrics: FunnelMetrics = {
    "Total Clicks": createMetric((totalClicks / 1000).toFixed(0) + "K", totalClicks, -0.18), // 18% decline
    CTR: createMetric(ctr + "%", parseFloat(ctr), -0.22), // 22% decline (red)
    "Avg CPC": createMetric(formatCurrency(avgCPC, "INR"), avgCPC, 0.15), // 15% growth
    "Google CTR": createMetric(isFinite(googleCTRValue) ? googleCTRValue.toFixed(2) + "%" : "—", googleCTRValue, -0.08), // 8% decline (on track)
    "DV360 CTR": createMetric(isFinite(dv360CTRValue) ? dv360CTRValue.toFixed(2) + "%" : "—", dv360CTRValue, -0.11), // 11% decline (yellow)
    "Meta CTR": createMetric(isFinite(metaCTRValue) ? metaCTRValue.toFixed(2) + "%" : "—", metaCTRValue, 0.12), // 12% growth
  };

  // BOFU metrics (6 chips)
  const totalConversions = data.total_conversions;
  const totalRevenue = data.total_revenue;
  const cvrValue = totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0;
  const roasValue = data.total_spend > 0 ? (totalRevenue / data.total_spend) : 0;
  const cpaValue = totalConversions > 0 ? (data.total_spend / totalConversions) : 0;

  // Guard values for formatting
  const cvrDisplay = isFinite(cvrValue) ? cvrValue.toFixed(2) : "0";
  const roasDisplay = isFinite(roasValue) ? roasValue.toFixed(2) : "0";
  const cpaDisplay = isFinite(cpaValue) ? formatCurrency(cpaValue, "INR") : "—";

  const bofuMetrics: FunnelMetrics = {
    Conversions: createMetric((totalConversions / 1000).toFixed(1) + "K", totalConversions, 0.25), // 25% growth (green)
    Revenue: createMetric(formatCurrency(totalRevenue, "INR"), totalRevenue, 0.30), // 30% growth (green)
    ROAS: createMetric(roasDisplay + "x", roasValue, -0.19), // 19% decline (yellow)
    CVR: createMetric(cvrDisplay + "%", cvrValue, -0.09), // 9% decline (on track)
    CPA: createMetric(cpaDisplay, cpaValue, -0.14), // 14% decline
    "Best Platform": createMetric("Google Ads", 1, 0), // stable
  };

  // Generate insights
  const topPlatformByImpressions = Object.entries(platformMetrics)
    .filter(([_, p]) => p.isActive)
    .sort(([_, a], [__, b]) => b.impressions - a.impressions)[0];

  const topPlatformByRoas = Object.entries(platformMetrics)
    .filter(([_, p]) => p.isActive)
    .sort(([_, a], [__, b]) => (b.revenue / b.spend || 0) - (a.revenue / a.spend || 0))[0];

  const tofuInsight = topPlatformByImpressions && data.total_impressions > 0
    ? `${topPlatformByImpressions[1].name} driving ${Math.round(
        (topPlatformByImpressions[1].impressions / data.total_impressions) * 100
      )}% of impressions`
    : "Analyzing audience reach";

  const mofuInsight = totalImpressions > 0
    ? `Overall CTR at ${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0"}% across ${Object.values(platformMetrics).filter((p) => p.isActive).length} platforms`
    : "Tracking engagement";

  const bofuInsight = topPlatformByRoas
    ? `${topPlatformByRoas[1].name} delivering ${topPlatformByRoas[1].spend > 0 ? (topPlatformByRoas[1].revenue / topPlatformByRoas[1].spend).toFixed(2) : "—"}x ROAS`
    : "Optimizing conversions";

  // Compute trend date range based on trendDays
  const today = new Date();
  const dateFromTime = new Date(today);
  dateFromTime.setDate(dateFromTime.getDate() - trendDays);
  const trendDateFrom = dateFromTime.toISOString().split("T")[0]; // YYYY-MM-DD
  const trendDateTo = today.toISOString().split("T")[0]; // YYYY-MM-DD

  // Derive campaign list for the filter dropdown
  const campaignList: { name: string; platform: string }[] = (data?.campaigns || []).map((c: any) => ({
    name: c.campaign_name,
    platform: c.platform?.toLowerCase(),
  }));

  // Resolve campaign filter → platform constraint
  const campaignPlatformFilter = trendCampaign !== "all"
    ? campaignList.find(c => c.name === trendCampaign)?.platform || null
    : null;

  // Filter daily metrics by trend days, platform, stage, and campaign
  const filteredDailyMetrics = dailyMetrics.filter((m: any) => {
    const inRange = m.date >= trendDateFrom && m.date <= trendDateTo;
    const inPlatform = trendPlatform === "all" || m.platform === trendPlatform;
    const inStage = trendStage === "all" || m.funnel_stage === trendStage;
    const inCampaign = !campaignPlatformFilter || m.platform === campaignPlatformFilter;
    return inRange && inPlatform && inStage && inCampaign;
  });

  // Handle alert dismissal
  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  // Handle recommendation dismissal
  const handleDismissRecommendation = (recId: string) => {
    setRecommendations(recommendations.filter(r => r.id !== recId));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Config Banner */}
      {configNeeded && (
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-elevated border border-border-primary text-text-secondary text-sm hover:bg-blue-950/30 transition-colors"
        >
          <Settings className="w-4 h-4 text-primary-500" />
          <span>Configure thresholds for <strong className="text-text-primary">{selectedAccount?.name || "this client"}</strong></span>
          <span className="ml-auto text-primary-500 font-medium">Settings &rarr;</span>
        </Link>
      )}

      {/* Alerts Strip */}
      <AlertStrip
        alerts={alerts}
        onDismiss={handleDismissAlert}
        accountId={selectedAccount?.id}
        dateFrom={monthFrom}
        dateTo={monthTo}
      />

      {/* Monitor/Diagnose/Act */}
      <MonitorDiagnoseAct accountId={selectedAccount?.id} />

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
            <h1 className="text-4xl font-bold text-text-primary">{selectedAccount?.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-text-secondary ml-13">
            <span>{formatCurrency(data.total_spend, selectedAccount?.currency)} spent</span>
            <span>•</span>
            {/* Month Picker Button */}
            <div className="relative">
              <motion.button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-base border border-border-primary hover:bg-surface-hover transition-colors"
              >
                <span>{monthLabel}</span>
                <ChevronDown className="w-4 h-4" />
              </motion.button>

              {/* Month Picker Dropdown */}
              {showMonthPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 z-50 bg-surface-base border border-border-primary shadow-lg rounded-lg p-3 w-48"
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
                            ? "bg-primary-500 text-white"
                            : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                        }`}
                      >
                        {month.slice(0, 3)}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowMonthPicker(false)}
                    className="w-full px-3 py-1 rounded text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    Close
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full Funnel Section */}
      <section className="bg-surface-elevated rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-semibold text-text-primary">{selectedAccount?.name} (All Accounts)</h2>
          <div className="h-px flex-1 bg-border-primary opacity-40" />
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Full Funnel Analysis</span>
        </div>

        <div className="space-y-6">
          {/* TOFU Section */}
          <FunnelSection
            title="Top of Funnel — Awareness"
            stage="tofu"
            metrics={tofuMetrics}
            insight={tofuInsight}
            platformCards={Object.values(platformMetrics)}
            selectedAccount={selectedAccount}
            monthFrom={monthFrom}
            monthTo={monthTo}
          />

          {/* MOFU Section */}
          <FunnelSection
            title="Middle of Funnel — Consideration"
            stage="mofu"
            metrics={mofuMetrics}
            insight={mofuInsight}
            platformCards={Object.values(platformMetrics)}
            selectedAccount={selectedAccount}
            monthFrom={monthFrom}
            monthTo={monthTo}
          />

          {/* BOFU Section */}
          <FunnelSection
            title="Bottom of Funnel — Conversion"
            stage="bofu"
            metrics={bofuMetrics}
            insight={bofuInsight}
            platformCards={Object.values(platformMetrics)}
            selectedAccount={selectedAccount}
            monthFrom={monthFrom}
            monthTo={monthTo}
          />
        </div>
      </section>

      {/* Performance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">Performance Trend</h3>
          </div>
          {/* Trend Days Selector */}
          <motion.div className="flex gap-2">
            {([7, 30, 90] as const).map((days) => (
              <motion.button
                key={days}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTrendDays(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  trendDays === days
                    ? "bg-primary-500 text-white"
                    : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {days}D
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Stage Tabs */}
        <motion.div className="flex gap-2 flex-wrap">
          {(["all", "tofu", "mofu", "bofu"] as const).map((stage) => (
            <motion.button
              key={stage}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTrendStage(stage);
                // Auto-switch metrics based on funnel stage
                if (stage === "tofu") {
                  setTrendMetrics(["impressions", "reach", "views"]);
                } else if (stage === "mofu") {
                  setTrendMetrics(["clicks", "ctr", "cpc"]);
                } else if (stage === "bofu") {
                  setTrendMetrics(["conversions", "revenue", "roas", "cpa"]);
                }
                // "all" keeps current user selection unchanged
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                trendStage === stage
                  ? "bg-primary-500 text-white"
                  : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
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
                  ? "bg-primary-500 text-white"
                  : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {platform === "all" ? "All Platforms" : platform === "dv360" ? "DV360" : platform.charAt(0).toUpperCase() + platform.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Campaign Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-text-secondary">Campaign:</label>
          <select
            value={trendCampaign}
            onChange={(e) => setTrendCampaign(e.target.value)}
            className="bg-surface-elevated text-text-primary text-sm rounded-lg px-3 py-2 border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Campaigns</option>
            {campaignList.map((c) => (
              <option key={c.name} value={c.name}>{c.name} ({c.platform})</option>
            ))}
          </select>
        </div>

        {/* Metric Selector */}
        <motion.div className="flex gap-2 flex-wrap">
          {["spend", "revenue", "impressions", "clicks", "conversions", "roas", "ctr", "cpc", "cpa", "reach", "views"].map((metric) => (
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
                  ? "bg-primary-500 text-white"
                  : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
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
                { key: "spend", name: "Spend", color: "#5C6BC0" },
                { key: "revenue", name: "Revenue", color: "#10B981" },
                { key: "impressions", name: "Impressions", color: "#F79009" },
                { key: "clicks", name: "Clicks", color: "#8B5CF6" },
                { key: "conversions", name: "Conversions", color: "#EC4899" },
                { key: "roas", name: "ROAS", color: "#06B6D4" },
                { key: "ctr", name: "CTR", color: "#F43F5E" },
                { key: "cpc", name: "CPC", color: "#A855F7" },
                { key: "cpa", name: "CPA", color: "#EAB308" },
                { key: "reach", name: "Reach", color: "#14B8A6" },
                { key: "views", name: "Views", color: "#FB923C" },
              ].filter((dk) => trendMetrics.includes(dk.key))}
              height={300}
            />
          ) : (
            <p className="text-center text-text-secondary py-8">No data for selected filters</p>
          )}
        </ChartContainer>
      </motion.div>

      {/* AI Recommendations Panel */}
      <RecommendationPanel
        recommendations={recommendations}
        onDismiss={handleDismissRecommendation}
        accountId={selectedAccount?.id}
        dateFrom={monthFrom}
        dateTo={monthTo}
      />

    </motion.div>
  );
}
