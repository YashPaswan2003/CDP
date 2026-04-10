"use client";

import { useState } from "react";
import { ChartContainer } from "@/components";

// @ts-ignore - Unused mock data kept for reference
const MOCK_CHART_DATA = {
  "Campaign Type": {
    labels: ["Search", "PMax", "VVC"],
    data: [45, 32, 28],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Campaign": {
    labels: ["Campaign A", "Campaign B", "Campaign C", "Campaign D"],
    data: [28, 18, 32, 22],
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
  },
  "Ad Group": {
    labels: ["Brand Keywords", "Competitor Terms", "Generic Search", "Long Tail"],
    data: [32, 20, 28, 20],
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
  },
  "Keyword": {
    labels: ["kotak mutual fund", "sip investment", "tax saving fd", "best mutual fund"],
    data: [28, 26, 20, 26],
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
  },
  "Geo": {
    labels: ["Mumbai", "Delhi", "Bangalore", "Chennai"],
    data: [30, 27, 22, 21],
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
  },
  "Device": {
    labels: ["Mobile", "Desktop", "Tablet"],
    data: [55, 35, 10],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Ad Set": {
    labels: ["Prospecting 25-35", "Retargeting", "Lookalike 1%"],
    data: [36, 30, 34],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Ad": {
    labels: ["Video Ad v1", "Carousel Ad", "Static Banner"],
    data: [36, 30, 34],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Placement": {
    labels: ["YouTube In-Stream", "Display Network", "Gmail"],
    data: [40, 36, 24],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Insertion Order": {
    labels: ["IO — Brand Awareness", "IO — Retargeting", "IO — Prospecting"],
    data: [38, 32, 30],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Line Item": {
    labels: ["LI — YouTube TrueView", "LI — Display Responsive", "LI — Connected TV"],
    data: [36, 34, 30],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Channel": {
    labels: ["YouTube", "Display", "Connected TV"],
    data: [43, 35, 22],
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
  },
  "Age/Gender": {
    labels: ["F 25-34", "M 25-34", "F 35-44", "M 35-44"],
    data: [25, 22, 28, 25],
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
  },
};

const MOCK_BREAKDOWN_DATA: Record<string, { name: string; impressions: number; clicks: number; ctr: number; cpc: number; cvr: number; conversions: number; spend: string; revenue: string; roas: string }[]> = {
  "Campaign Type": [
    { name: "Search", impressions: 125400, clicks: 8320, ctr: 6.64, cpc: 22.1, cvr: 0.41, conversions: 520, spend: "₹18.4L", revenue: "₹82.8L", roas: "4.5x" },
    { name: "PMax", impressions: 98600, clicks: 5240, ctr: 5.31, cpc: 29.0, cvr: 0.40, conversions: 420, spend: "₹15.2L", revenue: "₹63.8L", roas: "4.2x" },
    { name: "VVC", impressions: 76200, clicks: 3450, ctr: 4.53, cpc: 33.6, cvr: 0.41, conversions: 310, spend: "₹11.6L", revenue: "₹40.6L", roas: "3.5x" },
  ],
  "Campaign": [
    { name: "Campaign A", impressions: 85600, clicks: 5480, ctr: 6.40, cpc: 22.6, cvr: 0.40, conversions: 340, spend: "₹12.4L", revenue: "₹52.1L", roas: "4.2x" },
    { name: "Campaign B", impressions: 52300, clicks: 2980, ctr: 5.70, cpc: 28.8, cvr: 0.38, conversions: 280, spend: "₹8.6L", revenue: "₹32.6L", roas: "3.8x" },
    { name: "Campaign C", impressions: 98600, clicks: 6240, ctr: 6.33, cpc: 24.4, cvr: 0.41, conversions: 420, spend: "₹15.2L", revenue: "₹68.4L", roas: "4.5x" },
    { name: "Campaign D", impressions: 64200, clicks: 3580, ctr: 5.57, cpc: 25.1, cvr: 0.39, conversions: 210, spend: "₹9.0L", revenue: "₹28.8L", roas: "3.2x" },
  ],
  "Ad Group": [
    { name: "Brand Keywords", impressions: 48200, clicks: 3640, ctr: 7.55, cpc: 22.5, cvr: 0.45, conversions: 290, spend: "₹8.2L", revenue: "₹41.8L", roas: "5.1x" },
    { name: "Competitor Terms", impressions: 35800, clicks: 2180, ctr: 6.09, cpc: 29.4, cvr: 0.42, conversions: 185, spend: "₹6.4L", revenue: "₹24.3L", roas: "3.8x" },
    { name: "Generic Search", impressions: 42600, clicks: 2280, ctr: 5.35, cpc: 25.4, cvr: 0.39, conversions: 140, spend: "₹5.8L", revenue: "₹18.6L", roas: "3.2x" },
    { name: "Long Tail", impressions: 28400, clicks: 1280, ctr: 4.51, cpc: 32.8, cvr: 0.38, conversions: 98, spend: "₹4.2L", revenue: "₹12.2L", roas: "2.9x" },
  ],
  "Keyword": [
    { name: "kotak mutual fund", impressions: 18200, clicks: 1480, ctr: 8.13, cpc: 20.9, cvr: 0.48, conversions: 110, spend: "₹3.1L", revenue: "₹16.8L", roas: "5.4x" },
    { name: "sip investment", impressions: 16400, clicks: 1280, ctr: 7.80, cpc: 21.9, cvr: 0.46, conversions: 90, spend: "₹2.8L", revenue: "₹13.7L", roas: "4.9x" },
    { name: "tax saving fd", impressions: 12600, clicks: 760, ctr: 6.03, cpc: 25.0, cvr: 0.47, conversions: 62, spend: "₹1.9L", revenue: "₹7.8L", roas: "4.1x" },
    { name: "best mutual fund", impressions: 14200, clicks: 820, ctr: 5.77, cpc: 29.3, cvr: 0.45, conversions: 55, spend: "₹2.4L", revenue: "₹7.7L", roas: "3.2x" },
  ],
  "Geo": [
    { name: "Mumbai", impressions: 82400, clicks: 5840, ctr: 7.09, cpc: 24.3, cvr: 0.42, conversions: 390, spend: "₹14.2L", revenue: "₹62.6L", roas: "4.4x" },
    { name: "Delhi", impressions: 68900, clicks: 4180, ctr: 6.07, cpc: 28.2, cvr: 0.43, conversions: 320, spend: "₹11.8L", revenue: "₹48.5L", roas: "4.1x" },
    { name: "Bangalore", impressions: 55800, clicks: 3240, ctr: 5.80, cpc: 29.6, cvr: 0.44, conversions: 285, spend: "₹9.6L", revenue: "₹37.4L", roas: "3.9x" },
    { name: "Chennai", impressions: 42100, clicks: 2350, ctr: 5.58, cpc: 30.6, cvr: 0.43, conversions: 180, spend: "₹7.2L", revenue: "₹25.2L", roas: "3.5x" },
  ],
  "Device": [
    { name: "Mobile", impressions: 145800, clicks: 10520, ctr: 7.22, cpc: 23.5, cvr: 0.41, conversions: 680, spend: "₹24.8L", revenue: "₹104.4L", roas: "4.2x" },
    { name: "Desktop", impressions: 95600, clicks: 5820, ctr: 6.09, cpc: 28.2, cvr: 0.42, conversions: 480, spend: "₹16.4L", revenue: "₹63.9L", roas: "3.9x" },
    { name: "Tablet", impressions: 24200, clicks: 1070, ctr: 4.42, cpc: 37.4, cvr: 0.39, conversions: 90, spend: "₹4.0L", revenue: "₹12.4L", roas: "3.1x" },
  ],
  "Ad Set": [
    { name: "Prospecting 25-35", impressions: 58400, clicks: 3420, ctr: 5.86, cpc: 29.8, cvr: 0.43, conversions: 280, spend: "₹10.2L", revenue: "₹41.8L", roas: "4.1x" },
    { name: "Retargeting", impressions: 48200, clicks: 3680, ctr: 7.63, cpc: 22.8, cvr: 0.47, conversions: 310, spend: "₹8.4L", revenue: "₹40.3L", roas: "4.8x" },
    { name: "Lookalike 1%", impressions: 36800, clicks: 2160, ctr: 5.87, cpc: 31.5, cvr: 0.42, conversions: 190, spend: "₹6.8L", revenue: "₹25.2L", roas: "3.7x" },
  ],
  "Ad": [
    { name: "Video Ad v1", impressions: 42600, clicks: 2840, ctr: 6.67, cpc: 25.4, cvr: 0.44, conversions: 210, spend: "₹7.2L", revenue: "₹31.0L", roas: "4.3x" },
    { name: "Carousel Ad", impressions: 34200, clicks: 1980, ctr: 5.79, cpc: 29.3, cvr: 0.43, conversions: 175, spend: "₹5.8L", revenue: "₹22.6L", roas: "3.9x" },
    { name: "Static Banner", impressions: 26200, clicks: 1440, ctr: 5.50, cpc: 30.6, cvr: 0.42, conversions: 120, spend: "₹4.4L", revenue: "₹14.5L", roas: "3.3x" },
  ],
  "Placement": [
    { name: "YouTube In-Stream", impressions: 68400, clicks: 3240, ctr: 4.74, cpc: 37.0, cvr: 0.36, conversions: 245, spend: "₹12.0L", revenue: "₹45.6L", roas: "3.8x" },
    { name: "Display Network", impressions: 52200, clicks: 2480, ctr: 4.75, cpc: 34.7, cvr: 0.38, conversions: 180, spend: "₹8.6L", revenue: "₹27.5L", roas: "3.2x" },
    { name: "Gmail", impressions: 28600, clicks: 1420, ctr: 4.97, cpc: 29.6, cvr: 0.40, conversions: 95, spend: "₹4.2L", revenue: "₹14.7L", roas: "3.5x" },
  ],
  "Insertion Order": [
    { name: "IO — Brand Awareness", impressions: 108400, clicks: 4280, ctr: 3.95, cpc: 43.0, cvr: 0.35, conversions: 380, spend: "₹18.4L", revenue: "₹66.2L", roas: "3.6x" },
    { name: "IO — Retargeting", impressions: 72600, clicks: 3680, ctr: 5.07, cpc: 33.2, cvr: 0.39, conversions: 290, spend: "₹12.2L", revenue: "₹51.4L", roas: "4.2x" },
    { name: "IO — Prospecting", impressions: 58200, clicks: 2840, ctr: 4.88, cpc: 34.5, cvr: 0.38, conversions: 220, spend: "₹9.8L", revenue: "₹37.2L", roas: "3.8x" },
  ],
  "Line Item": [
    { name: "LI — YouTube TrueView", impressions: 48600, clicks: 2180, ctr: 4.48, cpc: 38.5, cvr: 0.37, conversions: 180, spend: "₹8.4L", revenue: "₹32.8L", roas: "3.9x" },
    { name: "LI — Display Responsive", impressions: 36200, clicks: 1680, ctr: 4.64, cpc: 36.9, cvr: 0.39, conversions: 145, spend: "₹6.2L", revenue: "₹21.1L", roas: "3.4x" },
    { name: "LI — Connected TV", impressions: 28400, clicks: 1200, ctr: 4.23, cpc: 48.3, cvr: 0.36, conversions: 95, spend: "₹5.8L", revenue: "₹17.9L", roas: "3.1x" },
  ],
  "Channel": [
    { name: "YouTube", impressions: 95600, clicks: 4240, ctr: 4.44, cpc: 38.2, cvr: 0.35, conversions: 340, spend: "₹16.2L", revenue: "₹61.6L", roas: "3.8x" },
    { name: "Display", impressions: 62400, clicks: 2840, ctr: 4.55, cpc: 36.6, cvr: 0.38, conversions: 220, spend: "₹10.4L", revenue: "₹35.3L", roas: "3.4x" },
    { name: "Connected TV", impressions: 28600, clicks: 1200, ctr: 4.20, cpc: 48.3, cvr: 0.36, conversions: 95, spend: "₹5.8L", revenue: "₹17.9L", roas: "3.1x" },
  ],
  "Age/Gender": [
    { name: "F 25-34", impressions: 54200, clicks: 3840, ctr: 7.08, cpc: 23.9, cvr: 0.43, conversions: 280, spend: "₹9.2L", revenue: "₹41.5L", roas: "4.5x" },
    { name: "M 25-34", impressions: 49600, clicks: 3280, ctr: 6.61, cpc: 25.6, cvr: 0.44, conversions: 240, spend: "₹8.4L", revenue: "₹34.5L", roas: "4.1x" },
    { name: "F 35-44", impressions: 40200, clicks: 2480, ctr: 6.17, cpc: 27.4, cvr: 0.43, conversions: 195, spend: "₹6.8L", revenue: "₹26.5L", roas: "3.9x" },
    { name: "M 35-44", impressions: 33400, clicks: 1920, ctr: 5.75, cpc: 29.2, cvr: 0.41, conversions: 160, spend: "₹5.6L", revenue: "₹19.6L", roas: "3.5x" },
  ],
};

// Helper function to format numbers
const formatNumber = (num: number): string => {
  return num.toLocaleString("en-IN");
};

// Helper function to format percentage
const formatPercentage = (num: number): string => {
  return `${num.toFixed(2)}%`;
};

// Helper function to format currency as CPC
const formatCPC = (num: number): string => {
  return `₹${num.toFixed(2)}`;
};

export function AnalyticsBuilder() {
  const [activeTab, setActiveTab] = useState<keyof typeof MOCK_BREAKDOWN_DATA>("Campaign Type");
  const [sortKey, setSortKey] = useState<"impressions" | "clicks" | "ctr" | "cpc" | "cvr" | "conversions" | "spend" | "roas">("conversions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: "impressions" | "clicks" | "ctr" | "cpc" | "cvr" | "conversions" | "spend" | "roas") => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const tabs = Object.keys(MOCK_BREAKDOWN_DATA) as Array<keyof typeof MOCK_BREAKDOWN_DATA>;

  const rawRows = MOCK_BREAKDOWN_DATA[activeTab] || MOCK_BREAKDOWN_DATA["Campaign Type"];
  const tableRows = [...rawRows].sort((a, b) => {
    let aVal: number, bVal: number;

    if (sortKey === "impressions") {
      aVal = a.impressions;
      bVal = b.impressions;
    } else if (sortKey === "clicks") {
      aVal = a.clicks;
      bVal = b.clicks;
    } else if (sortKey === "ctr") {
      aVal = a.ctr;
      bVal = b.ctr;
    } else if (sortKey === "cpc") {
      aVal = a.cpc;
      bVal = b.cpc;
    } else if (sortKey === "cvr") {
      aVal = a.cvr;
      bVal = b.cvr;
    } else if (sortKey === "conversions") {
      aVal = a.conversions;
      bVal = b.conversions;
    } else if (sortKey === "spend") {
      aVal = parseFloat(a.spend.replace(/[₹,L]/g, "")) * (a.spend.includes("L") ? 100000 : 1);
      bVal = parseFloat(b.spend.replace(/[₹,L]/g, "")) * (b.spend.includes("L") ? 100000 : 1);
    } else if (sortKey === "roas") {
      aVal = parseFloat(a.roas.replace("x", ""));
      bVal = parseFloat(b.roas.replace("x", ""));
    } else {
      aVal = a.conversions;
      bVal = b.conversions;
    }

    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-border-primary">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary-500 text-primary-400"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown Table */}
      <ChartContainer title={`${activeTab} Breakdown`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-[#6B7280] font-medium">{activeTab}</th>
                <th
                  onClick={() => handleSort("impressions")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  Impressions {sortKey === "impressions" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("clicks")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  Clicks {sortKey === "clicks" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("ctr")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  CTR {sortKey === "ctr" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("cpc")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  CPC {sortKey === "cpc" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("cvr")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  CVR {sortKey === "cvr" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("conversions")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  Conversions {sortKey === "conversions" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("spend")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  Spend {sortKey === "spend" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("roas")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  ROAS {sortKey === "roas" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className="border-b border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors">
                  <td className="px-4 py-3 text-[#1F2937] font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{formatNumber(row.impressions)}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{formatNumber(row.clicks)}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{formatPercentage(row.ctr)}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{formatCPC(row.cpc)}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{formatPercentage(row.cvr)}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{formatNumber(row.conversions)}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{row.spend}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937] font-medium">{row.roas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
}
