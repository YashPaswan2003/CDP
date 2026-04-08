"use client";

import { useState } from "react";
import { ChartContainer } from "@/components";
import { getPlacements } from "@/lib/mockData";

export default function PlacementsPage() {
  const [activeTab, setActiveTab] = useState<"youtube" | "display" | "meta">("youtube");

  const placements = getPlacements();
  const filteredPlacements = placements.filter((p) => p.placementType === activeTab);

  const tabs = [
    { id: "youtube", name: "YouTube", count: placements.filter((p) => p.placementType === "youtube").length },
    { id: "display", name: "Display Network", count: placements.filter((p) => p.placementType === "display").length },
    { id: "meta", name: "Meta", count: placements.filter((p) => p.placementType === "meta").length },
  ];

  const metaPlacements = [
    { name: "Feed", description: "Facebook and Instagram Feed" },
    { name: "Stories", description: "Stories Format" },
    { name: "Reels", description: "Reels Format" },
    { name: "Marketplace", description: "Facebook Marketplace" },
    { name: "Audience Network", description: "Third-party apps and sites" },
    { name: "Instagram", description: "Instagram Feed & Stories" },
    { name: "Messenger", description: "Messenger App" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Placement Reports</h1>
        <p className="text-text-secondary">Performance breakdown by platform and placement</p>
      </div>

      {/* Tabs */}
      <div className="card border-b border-border-primary">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "youtube" | "display" | "meta")}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-400"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.name}
              <span className="ml-2 text-xs bg-surface-hover px-2 py-1 rounded">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* YouTube Tab */}
      {activeTab === "youtube" && (
        <ChartContainer title="YouTube Placements Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left py-3 px-4 text-text-secondary">Placement</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Views</th>
                  <th className="text-right py-3 px-4 text-text-secondary">VTR</th>
                  <th className="text-right py-3 px-4 text-text-secondary">CTR</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Conversions</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Spend</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlacements.map((p, idx) => (
                  <tr key={idx} className="border-b border-border-primary hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-4 text-text-primary font-medium">{p.placementName}</td>
                    <td className="text-right py-3 px-4 text-text-primary">{p.views?.toLocaleString() || "N/A"}</td>
                    <td className="text-right py-3 px-4 text-accent-success font-semibold">{p.vtr?.toFixed(1) || "N/A"}%</td>
                    <td className="text-right py-3 px-4 text-primary-400 font-semibold">{p.ctr.toFixed(2)}%</td>
                    <td className="text-right py-3 px-4 text-accent-gold">{p.conversions}</td>
                    <td className="text-right py-3 px-4 text-text-primary font-medium">${p.spend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      )}

      {/* Display Network Tab */}
      {activeTab === "display" && (
        <ChartContainer title="Display Network Placements Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left py-3 px-4 text-text-secondary">Domain / Placement</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Impressions</th>
                  <th className="text-right py-3 px-4 text-text-secondary">CTR</th>
                  <th className="text-right py-3 px-4 text-text-secondary">CPC</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Conversions</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Spend</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlacements.map((p, idx) => (
                  <tr key={idx} className="border-b border-border-primary hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-4 text-text-primary font-medium">{p.placementName}</td>
                    <td className="text-right py-3 px-4 text-text-primary">{p.impressions.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-primary-400 font-semibold">{p.ctr.toFixed(2)}%</td>
                    <td className="text-right py-3 px-4 text-accent-gold">${p.cpc.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-accent-success">{p.conversions}</td>
                    <td className="text-right py-3 px-4 text-text-primary font-medium">${p.spend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      )}

      {/* Meta Tab */}
      {activeTab === "meta" && (
        <div className="space-y-6">
          {/* Meta Placements Table */}
          <ChartContainer title="Meta Placements Performance">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left py-3 px-4 text-text-secondary">Placement</th>
                      <th className="text-right py-3 px-4 text-text-secondary">Impressions</th>
                      <th className="text-right py-3 px-4 text-text-secondary">CTR</th>
                      <th className="text-right py-3 px-4 text-text-secondary">CVR</th>
                      <th className="text-right py-3 px-4 text-text-secondary">Spend</th>
                      <th className="text-right py-3 px-4 text-text-secondary">% of Total Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlacements.map((p, idx) => {
                      const totalSpend = filteredPlacements.reduce((sum, placement) => sum + placement.spend, 0);
                      const spendPercent = ((p.spend / totalSpend) * 100).toFixed(1);

                      return (
                        <tr key={idx} className="border-b border-border-primary hover:bg-surface-hover transition-colors">
                          <td className="py-3 px-4 text-text-primary font-medium">{p.placementName}</td>
                          <td className="text-right py-3 px-4 text-text-primary">{p.impressions.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-primary-400 font-semibold">{p.ctr.toFixed(2)}%</td>
                          <td className="text-right py-3 px-4 text-accent-success font-semibold">{p.cvr.toFixed(2)}%</td>
                          <td className="text-right py-3 px-4 text-text-primary">${p.spend.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-accent-gold font-semibold">{spendPercent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartContainer>

          {/* Meta Placement Types Info */}
          <ChartContainer title="Meta Placement Types">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metaPlacements.map((placement, idx) => (
                <div key={idx} className="p-4 border border-border-primary rounded-lg hover:bg-surface-hover transition-colors">
                  <h4 className="font-semibold text-text-primary mb-1">{placement.name}</h4>
                  <p className="text-text-secondary text-sm">{placement.description}</p>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
