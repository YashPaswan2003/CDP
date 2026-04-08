"use client";

import { useState, useMemo } from "react";
import { DataTable, ChartContainer, Button, MetricBadge } from "@/components";
import { calculateMetrics } from "@/lib/mockData";
import { Zap, Search } from "lucide-react";

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const campaigns = [
    {
      id: 1,
      name: "TechStore Product Launch",
      platform: "Google Ads",
      status: "active",
      spend: 2450,
      revenue: 8200,
      impressions: 18500,
      clicks: 925,
      conversions: 82,
      views: 0
    },
    {
      id: 2,
      name: "Summer Sale Push",
      platform: "Meta",
      status: "active",
      spend: 1890,
      revenue: 6100,
      impressions: 12000,
      clicks: 480,
      conversions: 65,
      views: 3200
    },
    {
      id: 3,
      name: "Brand Awareness",
      platform: "DV360",
      status: "paused",
      spend: 3200,
      revenue: 9500,
      impressions: 28000,
      clicks: 728,
      conversions: 52,
      views: 8900
    },
    {
      id: 4,
      name: "Holiday Collection",
      platform: "Google Ads",
      status: "active",
      spend: 4910,
      revenue: 21400,
      impressions: 35600,
      clicks: 1780,
      conversions: 214,
      views: 0
    },
  ];

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === "all" || c.platform === platformFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [searchTerm, platformFilter, statusFilter]);

  const platformColors: { [key: string]: string } = {
    "Google Ads": "bg-blue-500/20 text-blue-400",
    "Meta": "bg-purple-500/20 text-purple-400",
    "DV360": "bg-orange-500/20 text-orange-400",
  };

  const campaignTableData = filteredCampaigns.map((c) => {
    const metrics = calculateMetrics(c.spend, c.impressions, c.clicks, c.conversions, c.revenue, c.views);
    const roas = c.spend > 0 ? (c.revenue / c.spend).toFixed(2) : "0.00";

    return {
      campaign: (
        <div>
          <p className="font-medium text-text-primary">{c.name}</p>
          <div className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${platformColors[c.platform]}`}>
            {c.platform}
          </div>
        </div>
      ),
      status: <MetricBadge label={c.status} type={c.status === "active" ? "success" : "neutral"} size="sm" />,
      spend: `$${c.spend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      revenue: `$${c.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      roas: <span className="font-semibold text-accent-gold">{roas}x</span>,
      ctr: <span className="text-accent-gold">{metrics.ctr.toFixed(2)}%</span>,
      cpc: <span className="text-accent-gold">${metrics.cpc.toFixed(2)}</span>,
      cpm: <span className="text-accent-gold">${metrics.cpm.toFixed(2)}</span>,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Campaigns</h1>
          <p className="text-text-secondary">Manage and monitor all your advertising campaigns</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Platforms</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta">Meta</option>
              <option value="DV360">DV360</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <ChartContainer title="All Campaigns">
        <DataTable
          columns={[
            { key: "campaign", label: "Campaign" },
            { key: "status", label: "Status", align: "center" },
            { key: "spend", label: "Spend", align: "right" },
            { key: "revenue", label: "Revenue", align: "right" },
            { key: "roas", label: "ROAS", align: "right" },
            { key: "ctr", label: "CTR", align: "right" },
            { key: "cpc", label: "CPC", align: "right" },
            { key: "cpm", label: "CPM", align: "right" },
          ]}
          data={campaignTableData}
        />
      </ChartContainer>
    </div>
  );
}
