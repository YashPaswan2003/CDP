"use client";

import { useState } from "react";
import { ChartContainer, BarChart } from "@/components";
import { getSearchTerms, getPMaxChannels } from "@/lib/mockData";
import { Search } from "lucide-react";

export default function GoogleReportsPage() {
  const [activeTab, setActiveTab] = useState<"search" | "pmax">("search");
  const [searchFilter, setSearchFilter] = useState("");

  const searchTerms = getSearchTerms();
  const pMaxChannels = getPMaxChannels();

  const filteredSearchTerms = searchTerms.filter((t) =>
    t.keyword.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const qualityScoreBadgeColor = (score: number) => {
    if (score >= 9) return "bg-accent-success/20 text-accent-success";
    if (score >= 7) return "bg-primary-500/20 text-primary-400";
    if (score >= 5) return "bg-accent-gold/20 text-accent-gold";
    return "bg-accent-error/20 text-accent-error";
  };

  const matchTypeColors: { [key: string]: string } = {
    Exact: "bg-blue-500/20 text-blue-400",
    Phrase: "bg-purple-500/20 text-purple-400",
    Broad: "bg-orange-500/20 text-orange-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Google Ads Reports</h1>
        <p className="text-text-secondary">Search campaigns and PMax channel performance breakdown</p>
      </div>

      {/* Tabs */}
      <div className="card border-b border-border-primary">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === "search"
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            Search Terms
            <span className="ml-2 text-xs bg-surface-hover px-2 py-1 rounded">({searchTerms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("pmax")}
            className={`px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === "pmax"
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            PMax Channels
            <span className="ml-2 text-xs bg-surface-hover px-2 py-1 rounded">({pMaxChannels.length})</span>
          </button>
        </div>
      </div>

      {/* Search Terms Tab */}
      {activeTab === "search" && (
        <div className="space-y-6">
          {/* Search Filter */}
          <div className="card">
            <div className="flex items-center gap-2 relative">
              <Search className="absolute left-3 w-4 h-4 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Search Terms Table */}
          <ChartContainer title="Search Terms Performance">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-3 px-4 text-text-secondary">Keyword</th>
                    <th className="text-left py-3 px-4 text-text-secondary">Match Type</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Impressions</th>
                    <th className="text-right py-3 px-4 text-text-secondary">CTR</th>
                    <th className="text-right py-3 px-4 text-text-secondary">CPC</th>
                    <th className="text-right py-3 px-4 text-text-secondary">CVR</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Conversions</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Quality Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSearchTerms.map((term, idx) => (
                    <tr key={idx} className="border-b border-border-primary hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-4 text-text-primary font-medium">{term.keyword}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${matchTypeColors[term.matchType]}`}>
                          {term.matchType}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-text-primary">{term.impressions.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-primary-400 font-semibold">{term.ctr.toFixed(2)}%</td>
                      <td className="text-right py-3 px-4 text-accent-gold">${term.cpc.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-accent-success font-semibold">{term.cvr.toFixed(2)}%</td>
                      <td className="text-right py-3 px-4 text-text-primary font-medium">{term.conversions}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded font-bold text-xs ${qualityScoreBadgeColor(term.qualityScore)}`}>
                          {term.qualityScore}/10
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartContainer>

          {/* Quality Score Distribution */}
          <ChartContainer title="Quality Score Distribution">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 bg-accent-success/10 rounded-lg border border-accent-success/30">
                <p className="text-text-secondary text-sm">Excellent (9-10)</p>
                <p className="text-3xl font-bold text-accent-success mt-2">{searchTerms.filter((t) => t.qualityScore >= 9).length}</p>
              </div>
              <div className="p-4 bg-primary-500/10 rounded-lg border border-primary-500/30">
                <p className="text-text-secondary text-sm">Good (7-8)</p>
                <p className="text-3xl font-bold text-primary-400 mt-2">{searchTerms.filter((t) => t.qualityScore >= 7 && t.qualityScore < 9).length}</p>
              </div>
              <div className="p-4 bg-accent-gold/10 rounded-lg border border-accent-gold/30">
                <p className="text-text-secondary text-sm">Average (5-6)</p>
                <p className="text-3xl font-bold text-accent-gold mt-2">{searchTerms.filter((t) => t.qualityScore >= 5 && t.qualityScore < 7).length}</p>
              </div>
              <div className="p-4 bg-accent-error/10 rounded-lg border border-accent-error/30">
                <p className="text-text-secondary text-sm">Poor (1-4)</p>
                <p className="text-3xl font-bold text-accent-error mt-2">{searchTerms.filter((t) => t.qualityScore < 5).length}</p>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <p className="text-text-secondary text-sm">Average QS</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">
                  {(searchTerms.reduce((sum, t) => sum + t.qualityScore, 0) / searchTerms.length).toFixed(1)}
                </p>
              </div>
            </div>
          </ChartContainer>
        </div>
      )}

      {/* PMax Channels Tab */}
      {activeTab === "pmax" && (
        <div className="space-y-6">
          {/* Channel Comparison Bar Chart */}
          <ChartContainer title="PMax Channels Performance">
            <BarChart
              data={pMaxChannels}
              dataKeys={[
                { key: "impressions", name: "Impressions", color: "#3B82F6" },
                { key: "clicks", name: "Clicks", color: "#F59E0B" },
                { key: "conversions", name: "Conversions", color: "#10B981" },
              ]}
              xAxisKey="channel"
              height={350}
            />
          </ChartContainer>

          {/* Channels Table */}
          <ChartContainer title="PMax Channels Detailed Performance">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-3 px-4 text-text-secondary">Channel</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Impressions</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Clicks</th>
                    <th className="text-right py-3 px-4 text-text-secondary">CTR</th>
                    <th className="text-right py-3 px-4 text-text-secondary">CPC</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Conversions</th>
                    <th className="text-right py-3 px-4 text-text-secondary">CVR</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Spend</th>
                    <th className="text-right py-3 px-4 text-text-secondary">Revenue</th>
                    <th className="text-right py-3 px-4 text-text-secondary">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {pMaxChannels.map((channel, idx) => (
                    <tr key={idx} className="border-b border-border-primary hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-4 text-text-primary font-medium">{channel.channel}</td>
                      <td className="text-right py-3 px-4 text-text-primary">{channel.impressions.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-text-primary">{channel.clicks.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-primary-400 font-semibold">{channel.ctr.toFixed(2)}%</td>
                      <td className="text-right py-3 px-4 text-accent-gold">${channel.cpc.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-accent-success">{channel.conversions}</td>
                      <td className="text-right py-3 px-4 text-accent-success font-semibold">{channel.cvr.toFixed(2)}%</td>
                      <td className="text-right py-3 px-4 text-text-primary">${channel.spend.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-text-primary">${channel.revenue.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 font-bold text-accent-gold">{channel.roas.toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartContainer>

          {/* Channel Efficiency Cards */}
          <ChartContainer title="Channel Efficiency Analysis">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary-500/10 rounded-lg border border-primary-500/30">
                <p className="text-text-secondary text-sm mb-2">Highest ROAS</p>
                <p className="text-lg font-bold text-primary-400">
                  {pMaxChannels.sort((a, b) => b.roas - a.roas)[0].channel}
                </p>
                <p className="text-2xl font-bold text-text-primary mt-2">
                  {pMaxChannels.sort((a, b) => b.roas - a.roas)[0].roas.toFixed(2)}x
                </p>
              </div>

              <div className="p-4 bg-accent-success/10 rounded-lg border border-accent-success/30">
                <p className="text-text-secondary text-sm mb-2">Lowest CPC</p>
                <p className="text-lg font-bold text-accent-success">
                  {pMaxChannels.sort((a, b) => a.cpc - b.cpc)[0].channel}
                </p>
                <p className="text-2xl font-bold text-text-primary mt-2">
                  ${pMaxChannels.sort((a, b) => a.cpc - b.cpc)[0].cpc.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-accent-gold/10 rounded-lg border border-accent-gold/30">
                <p className="text-text-secondary text-sm mb-2">Highest CVR</p>
                <p className="text-lg font-bold text-accent-gold">
                  {pMaxChannels.sort((a, b) => b.cvr - a.cvr)[0].channel}
                </p>
                <p className="text-2xl font-bold text-text-primary mt-2">
                  {pMaxChannels.sort((a, b) => b.cvr - a.cvr)[0].cvr.toFixed(2)}%
                </p>
              </div>
            </div>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
