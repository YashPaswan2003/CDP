"use client";

import { useAccount } from "@/lib/accountContext";
import { useParams, useRouter } from "next/navigation";
import { fetchCampaigns, fetchDailyMetrics } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Star,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  type?: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cvr: number;
  roas: number;
}

interface DailyMetric {
  date: string;
  platform: string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedAccount } = useAccount();

  const campaignId = decodeURIComponent(params.id as string);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [campaignData, metricsData] = await Promise.all([
          fetchCampaigns({ account_id: selectedAccount?.id }),
          fetchDailyMetrics({ account_id: selectedAccount?.id }),
        ]);
        setCampaigns(campaignData);
        setDailyMetrics(metricsData);
      } catch (err) {
        console.error("Failed to load campaign data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedAccount?.id]);

  // Find the specific campaign by name or ID
  const campaign = useMemo(() => {
    return campaigns.find(
      (c) =>
        c.name === campaignId ||
        c.id === campaignId ||
        c.name.toLowerCase().replace(/\s+/g, "-") === campaignId.toLowerCase()
    );
  }, [campaigns, campaignId]);

  // Filter daily metrics for this campaign's platform
  const campaignDailyMetrics = useMemo(() => {
    if (!campaign) return [];
    return dailyMetrics
      .filter((m) => m.platform === campaign.platform)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dailyMetrics, campaign]);

  // Compute % change by splitting daily metrics into two halves
  const kpiChanges = useMemo(() => {
    if (campaignDailyMetrics.length < 2) {
      return { spend: 0, revenue: 0, roas: 0, ctr: 0, cpc: 0, conversions: 0 };
    }
    const mid = Math.floor(campaignDailyMetrics.length / 2);
    const firstHalf = campaignDailyMetrics.slice(0, mid);
    const secondHalf = campaignDailyMetrics.slice(mid);

    const sum = (arr: DailyMetric[], key: keyof DailyMetric) =>
      arr.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);

    const spendFirst = sum(firstHalf, "spend");
    const spendSecond = sum(secondHalf, "spend");
    const revFirst = sum(firstHalf, "revenue");
    const revSecond = sum(secondHalf, "revenue");
    const convFirst = sum(firstHalf, "conversions");
    const convSecond = sum(secondHalf, "conversions");
    const clicksFirst = sum(firstHalf, "clicks");
    const clicksSecond = sum(secondHalf, "clicks");
    const impFirst = sum(firstHalf, "impressions");
    const impSecond = sum(secondHalf, "impressions");

    const pctChange = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev) * 100 : 0;

    const ctrFirst = impFirst > 0 ? clicksFirst / impFirst : 0;
    const ctrSecond = impSecond > 0 ? clicksSecond / impSecond : 0;
    const cpcFirst = clicksFirst > 0 ? spendFirst / clicksFirst : 0;
    const cpcSecond = clicksSecond > 0 ? spendSecond / clicksSecond : 0;
    const roasFirst = spendFirst > 0 ? revFirst / spendFirst : 0;
    const roasSecond = spendSecond > 0 ? revSecond / spendSecond : 0;

    return {
      spend: pctChange(spendSecond, spendFirst),
      revenue: pctChange(revSecond, revFirst),
      roas: pctChange(roasSecond, roasFirst),
      ctr: pctChange(ctrSecond, ctrFirst),
      cpc: pctChange(cpcSecond, cpcFirst),
      conversions: pctChange(convSecond, convFirst),
    };
  }, [campaignDailyMetrics]);

  // Similar campaigns: same platform and optionally same type
  const similarCampaigns = useMemo(() => {
    if (!campaign) return [];
    return campaigns.filter(
      (c) => c.platform === campaign.platform && c.id !== campaign.id
    );
  }, [campaigns, campaign]);

  // Chart data formatted for Recharts
  const chartData = useMemo(() => {
    return campaignDailyMetrics.map((m) => ({
      date: new Date(m.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      Spend: m.spend,
      Revenue: m.revenue,
      Conversions: m.conversions,
    }));
  }, [campaignDailyMetrics]);

  const platformLabel: Record<string, string> = {
    google: "Google Ads",
    dv360: "DV360",
    meta: "Meta",
  };

  const statusColor: Record<string, string> = {
    active: "text-green-400 bg-green-500/10 border-green-500/30",
    paused: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    ended: "text-gray-400 bg-gray-500/10 border-gray-500/30",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Campaign not found</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </button>
      </div>
    );
  }

  const currency = selectedAccount?.currency || "INR";

  const kpiCards = [
    {
      label: "Spend",
      value: formatCurrency(campaign.spent, currency),
      change: kpiChanges.spend,
    },
    {
      label: "Revenue",
      value: formatCurrency(campaign.revenue, currency),
      change: kpiChanges.revenue,
    },
    {
      label: "ROAS",
      value: `${campaign.roas.toFixed(1)}x`,
      change: kpiChanges.roas,
    },
    {
      label: "CTR",
      value: `${(campaign.ctr * 100).toFixed(1)}%`,
      change: kpiChanges.ctr,
    },
    {
      label: "CPC",
      value: formatCurrency(campaign.cpc, currency),
      change: kpiChanges.cpc,
      invertColor: true, // lower CPC is better
    },
    {
      label: "Conversions",
      value: formatNumber(campaign.conversions),
      change: kpiChanges.conversions,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono">
              {campaign.name}
            </h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {platformLabel[campaign.platform] || campaign.platform}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusColor[campaign.status] || statusColor.ended}`}
            >
              {campaign.status}
            </span>
            <span className="text-sm text-gray-400">
              Budget: {formatCurrency(campaign.budget, currency)}
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiCards.map((kpi) => {
            const isPositive = kpi.invertColor
              ? kpi.change < 0
              : kpi.change > 0;
            const changeAbs = Math.abs(kpi.change);

            return (
              <div
                key={kpi.label}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2"
              >
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="text-lg font-bold text-white font-mono">
                  {kpi.value}
                </p>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {isPositive ? "+" : "-"}
                    {changeAbs.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Over Time Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">
            Campaign Performance Over Time
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <RLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                    color: "#f9fafb",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Spend"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Conversions"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </RLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No daily metrics available for this campaign.
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">
            Compare with Similar Campaigns
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Campaign
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    Spend
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    ROAS
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    CTR
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    Conversions
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Current campaign - highlighted */}
                <tr className="bg-blue-500/10 border-b border-gray-800">
                  <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {campaign.name}
                  </td>
                  <td className="text-right py-3 px-4 text-white font-mono">
                    {formatCurrency(campaign.spent, currency)}
                  </td>
                  <td className="text-right py-3 px-4 text-white font-mono">
                    {formatCurrency(campaign.revenue, currency)}
                  </td>
                  <td className="text-right py-3 px-4 text-white font-mono">
                    {campaign.roas.toFixed(1)}x
                  </td>
                  <td className="text-right py-3 px-4 text-white font-mono">
                    {(campaign.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-4 text-white font-mono">
                    {formatNumber(campaign.conversions)}
                  </td>
                </tr>
                {/* Similar campaigns */}
                {similarCampaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-300">{c.name}</td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      {formatCurrency(c.spent, currency)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      {formatCurrency(c.revenue, currency)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      {c.roas.toFixed(1)}x
                    </td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      {(c.ctr * 100).toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      {formatNumber(c.conversions)}
                    </td>
                  </tr>
                ))}
                {similarCampaigns.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 px-4 text-center text-gray-500"
                    >
                      No similar campaigns found on this platform.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
