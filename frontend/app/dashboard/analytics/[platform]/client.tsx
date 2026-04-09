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

const MOCK_BREAKDOWN_DATA: Record<string, { name: string; spend: string; conversions: number; roas: string }[]> = {
  "Campaign Type": [
    { name: "Search", spend: "₹18.4L", conversions: 520, roas: "4.5x" },
    { name: "PMax", spend: "₹15.2L", conversions: 420, roas: "4.2x" },
    { name: "VVC", spend: "₹11.6L", conversions: 310, roas: "3.5x" },
  ],
  "Campaign": [
    { name: "Campaign A", spend: "₹12.4L", conversions: 340, roas: "4.2x" },
    { name: "Campaign B", spend: "₹8.6L", conversions: 280, roas: "3.8x" },
    { name: "Campaign C", spend: "₹15.2L", conversions: 420, roas: "4.5x" },
    { name: "Campaign D", spend: "₹9.0L", conversions: 210, roas: "3.2x" },
  ],
  "Ad Group": [
    { name: "Brand Keywords", spend: "₹8.2L", conversions: 290, roas: "5.1x" },
    { name: "Competitor Terms", spend: "₹6.4L", conversions: 185, roas: "3.8x" },
    { name: "Generic Search", spend: "₹5.8L", conversions: 140, roas: "3.2x" },
    { name: "Long Tail", spend: "₹4.2L", conversions: 98, roas: "2.9x" },
  ],
  "Keyword": [
    { name: "kotak mutual fund", spend: "₹3.1L", conversions: 110, roas: "5.4x" },
    { name: "sip investment", spend: "₹2.8L", conversions: 90, roas: "4.9x" },
    { name: "tax saving fd", spend: "₹1.9L", conversions: 62, roas: "4.1x" },
    { name: "best mutual fund", spend: "₹2.4L", conversions: 55, roas: "3.2x" },
  ],
  "Geo": [
    { name: "Mumbai", spend: "₹14.2L", conversions: 390, roas: "4.4x" },
    { name: "Delhi", spend: "₹11.8L", conversions: 320, roas: "4.1x" },
    { name: "Bangalore", spend: "₹9.6L", conversions: 285, roas: "3.9x" },
    { name: "Chennai", spend: "₹7.2L", conversions: 180, roas: "3.5x" },
  ],
  "Device": [
    { name: "Mobile", spend: "₹24.8L", conversions: 680, roas: "4.2x" },
    { name: "Desktop", spend: "₹16.4L", conversions: 480, roas: "3.9x" },
    { name: "Tablet", spend: "₹4.0L", conversions: 90, roas: "3.1x" },
  ],
  "Ad Set": [
    { name: "Prospecting 25-35", spend: "₹10.2L", conversions: 280, roas: "4.1x" },
    { name: "Retargeting", spend: "₹8.4L", conversions: 310, roas: "4.8x" },
    { name: "Lookalike 1%", spend: "₹6.8L", conversions: 190, roas: "3.7x" },
  ],
  "Ad": [
    { name: "Video Ad v1", spend: "₹7.2L", conversions: 210, roas: "4.3x" },
    { name: "Carousel Ad", spend: "₹5.8L", conversions: 175, roas: "3.9x" },
    { name: "Static Banner", spend: "₹4.4L", conversions: 120, roas: "3.3x" },
  ],
  "Placement": [
    { name: "YouTube In-Stream", spend: "₹12.0L", conversions: 245, roas: "3.8x" },
    { name: "Display Network", spend: "₹8.6L", conversions: 180, roas: "3.2x" },
    { name: "Gmail", spend: "₹4.2L", conversions: 95, roas: "3.5x" },
  ],
  "Insertion Order": [
    { name: "IO — Brand Awareness", spend: "₹18.4L", conversions: 380, roas: "3.6x" },
    { name: "IO — Retargeting", spend: "₹12.2L", conversions: 290, roas: "4.2x" },
    { name: "IO — Prospecting", spend: "₹9.8L", conversions: 220, roas: "3.8x" },
  ],
  "Line Item": [
    { name: "LI — YouTube TrueView", spend: "₹8.4L", conversions: 180, roas: "3.9x" },
    { name: "LI — Display Responsive", spend: "₹6.2L", conversions: 145, roas: "3.4x" },
    { name: "LI — Connected TV", spend: "₹5.8L", conversions: 95, roas: "3.1x" },
  ],
  "Channel": [
    { name: "YouTube", spend: "₹16.2L", conversions: 340, roas: "3.8x" },
    { name: "Display", spend: "₹10.4L", conversions: 220, roas: "3.4x" },
    { name: "Connected TV", spend: "₹5.8L", conversions: 95, roas: "3.1x" },
  ],
  "Age/Gender": [
    { name: "F 25-34", spend: "₹9.2L", conversions: 280, roas: "4.5x" },
    { name: "M 25-34", spend: "₹8.4L", conversions: 240, roas: "4.1x" },
    { name: "F 35-44", spend: "₹6.8L", conversions: 195, roas: "3.9x" },
    { name: "M 35-44", spend: "₹5.6L", conversions: 160, roas: "3.5x" },
  ],
};

export function AnalyticsBuilder() {
  const [activeTab, setActiveTab] = useState<keyof typeof MOCK_BREAKDOWN_DATA>("Campaign Type");
  const [sortKey, setSortKey] = useState<"spend" | "conversions" | "roas">("conversions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: "spend" | "conversions" | "roas") => {
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
    if (sortKey === "spend") {
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
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-[#6B7280] font-medium">{activeTab}</th>
                <th
                  onClick={() => handleSort("spend")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  Spend {sortKey === "spend" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
                </th>
                <th
                  onClick={() => handleSort("conversions")}
                  className="px-4 py-3 text-right text-[#6B7280] font-medium cursor-pointer hover:text-[#1F2937] select-none"
                >
                  Conversions {sortKey === "conversions" ? (sortDir === "desc" ? "↓" : "↑") : <span className="opacity-40">↕</span>}
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
                  <td className="px-4 py-3 text-right text-[#1F2937]">{row.spend}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{row.conversions.toLocaleString()}</td>
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
