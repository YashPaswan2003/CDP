"use client";

import { useMemo } from "react";
import { ChartContainer, BarChart } from "@/components";
import { getCreatives } from "@/lib/mockData";

export default function CreativesPage() {
  const creatives = getCreatives();

  // Top performers by CTR
  const topPerformers = useMemo(() => {
    return [...creatives].sort((a, b) => b.ctr - a.ctr).slice(0, 5);
  }, [creatives]);

  // Bottom performers by CTR
  const bottomPerformers = useMemo(() => {
    return [...creatives].sort((a, b) => a.ctr - b.ctr).slice(0, 5);
  }, [creatives]);

  // Format comparison
  const formatComparison = useMemo(() => {
    const formats = { image: { ctr: 0, cvr: 0, count: 0 }, video: { ctr: 0, cvr: 0, count: 0 }, carousel: { ctr: 0, cvr: 0, count: 0 } };

    creatives.forEach((c) => {
      formats[c.format].ctr += c.ctr;
      formats[c.format].cvr += c.cvr;
      formats[c.format].count += 1;
    });

    return [
      { name: "Image", ctr: formats.image.count > 0 ? formats.image.ctr / formats.image.count : 0, cvr: formats.image.count > 0 ? formats.image.cvr / formats.image.count : 0 },
      { name: "Video", ctr: formats.video.count > 0 ? formats.video.ctr / formats.video.count : 0, cvr: formats.video.count > 0 ? formats.video.cvr / formats.video.count : 0 },
      { name: "Carousel", ctr: formats.carousel.count > 0 ? formats.carousel.ctr / formats.carousel.count : 0, cvr: formats.carousel.count > 0 ? formats.carousel.cvr / formats.carousel.count : 0 },
    ];
  }, [creatives]);

  const platformColors: { [key: string]: string } = {
    google: "bg-blue-500/20 text-blue-400",
    meta: "bg-purple-500/20 text-purple-400",
    dv360: "bg-orange-500/20 text-orange-400",
  };

  const formatIcons: { [key: string]: string } = {
    image: "🖼️",
    video: "🎥",
    carousel: "📱",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Creative Reports</h1>
        <p className="text-text-secondary">Analyze creative performance and identify high-performing assets</p>
      </div>

      {/* All Creatives Table */}
      <ChartContainer title="All Creatives Performance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left py-3 px-4 text-text-secondary">Creative Name</th>
                <th className="text-left py-3 px-4 text-text-secondary">Format</th>
                <th className="text-left py-3 px-4 text-text-secondary">Platform</th>
                <th className="text-right py-3 px-4 text-text-secondary">Impressions</th>
                <th className="text-right py-3 px-4 text-text-secondary">CTR</th>
                <th className="text-right py-3 px-4 text-text-secondary">CVR</th>
                <th className="text-right py-3 px-4 text-text-secondary">ROAS</th>
                <th className="text-right py-3 px-4 text-text-secondary">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {creatives.map((c) => (
                <tr key={c.creativeId} className="border-b border-border-primary hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4 text-text-primary font-medium">{c.creativeName}</td>
                  <td className="py-3 px-4">
                    <span className="text-lg">{formatIcons[c.format]}</span> {c.format}
                  </td>
                  <td className="py-3 px-4">
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${platformColors[c.platform]}`}>
                      {c.platform.toUpperCase()}
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-text-primary">{c.impressions.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-primary-400 font-semibold">{c.ctr.toFixed(2)}%</td>
                  <td className="text-right py-3 px-4 text-accent-success font-semibold">{c.cvr.toFixed(2)}%</td>
                  <td className="text-right py-3 px-4 text-accent-gold font-semibold">{c.roas.toFixed(2)}x</td>
                  <td className="text-right py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${c.frequency > 3 ? "bg-accent-error/20 text-accent-error" : "bg-accent-success/20 text-accent-success"}`}>
                      {c.frequency.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Top vs Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Top 5 Creatives by CTR">
          <div className="space-y-3">
            {topPerformers.map((c, idx) => (
              <div key={c.creativeId} className="p-4 bg-surface-hover rounded-lg border border-accent-success/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary mb-1">{idx + 1}. {c.creativeName}</p>
                    <p className="text-xs text-text-tertiary">{c.format} • {c.platform.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent-success">{c.ctr.toFixed(2)}%</p>
                    <p className="text-xs text-text-tertiary">CTR</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="p-2 bg-surface-base rounded">
                    <p className="text-text-tertiary">CVR</p>
                    <p className="font-semibold text-text-primary">{c.cvr.toFixed(2)}%</p>
                  </div>
                  <div className="p-2 bg-surface-base rounded">
                    <p className="text-text-tertiary">ROAS</p>
                    <p className="font-semibold text-text-primary">{c.roas.toFixed(2)}x</p>
                  </div>
                  <div className="p-2 bg-surface-base rounded">
                    <p className="text-text-tertiary">Freq</p>
                    <p className="font-semibold text-text-primary">{c.frequency.toFixed(1)}x</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer title="Bottom 5 Creatives by CTR">
          <div className="space-y-3">
            {bottomPerformers.map((c, idx) => (
              <div key={c.creativeId} className="p-4 bg-surface-hover rounded-lg border border-accent-error/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary mb-1">{idx + 1}. {c.creativeName}</p>
                    <p className="text-xs text-text-tertiary">{c.format} • {c.platform.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent-error">{c.ctr.toFixed(2)}%</p>
                    <p className="text-xs text-text-tertiary">CTR</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="p-2 bg-surface-base rounded">
                    <p className="text-text-tertiary">CVR</p>
                    <p className="font-semibold text-text-primary">{c.cvr.toFixed(2)}%</p>
                  </div>
                  <div className="p-2 bg-surface-base rounded">
                    <p className="text-text-tertiary">ROAS</p>
                    <p className="font-semibold text-text-primary">{c.roas.toFixed(2)}x</p>
                  </div>
                  <div className="p-2 bg-surface-base rounded">
                    <p className="text-text-tertiary">Freq</p>
                    <p className="font-semibold text-text-primary">{c.frequency.toFixed(1)}x</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* Format Comparison */}
      <ChartContainer title="Format Comparison">
        <BarChart
          data={formatComparison}
          dataKeys={[
            { key: "ctr", name: "CTR (%)", color: "#3B82F6" },
            { key: "cvr", name: "CVR (%)", color: "#10B981" },
          ]}
          xAxisKey="name"
          layout="horizontal"
          height={250}
        />
      </ChartContainer>

      {/* Creative Insights */}
      <ChartContainer title="Creative Insights">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary-500/10 rounded-lg border border-primary-500/30">
            <p className="text-text-secondary text-sm mb-2">Best Performing Format</p>
            <p className="text-2xl font-bold text-primary-400">
              {formatComparison.sort((a, b) => b.ctr - a.ctr)[0].name}
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              Avg CTR: {formatComparison.sort((a, b) => b.ctr - a.ctr)[0].ctr.toFixed(2)}%
            </p>
          </div>

          <div className="p-4 bg-accent-success/10 rounded-lg border border-accent-success/30">
            <p className="text-text-secondary text-sm mb-2">Highest ROAS</p>
            <p className="text-2xl font-bold text-accent-success">
              {creatives.sort((a, b) => b.roas - a.roas)[0].creativeName}
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              ROAS: {creatives.sort((a, b) => b.roas - a.roas)[0].roas.toFixed(2)}x
            </p>
          </div>

          <div className="p-4 bg-accent-error/10 rounded-lg border border-accent-error/30">
            <p className="text-text-secondary text-sm mb-2">Fatigue Alert</p>
            <p className="text-2xl font-bold text-accent-error">
              {creatives.filter((c) => c.frequency > 3).length} Creatives
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              Above 3x frequency threshold
            </p>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}
