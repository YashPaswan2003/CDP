"use client";

import { useState } from "react";
import { ChartContainer, FunnelChart } from "@/components";
import { generateDailyMetrics } from "@/lib/mockData";

export default function FunnelPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "google" | "meta" | "dv360">("all");

  const dailyMetrics = generateDailyMetrics();

  // Calculate funnel metrics
  const calculateFunnel = (platform: "all" | "google" | "meta" | "dv360") => {
    let metrics = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    dailyMetrics.forEach((m) => {
      if (platform === "all" || m.platform === platform) {
        metrics.impressions += m.impressions;
        metrics.clicks += m.clicks;
        metrics.conversions += m.conversions;
      }
    });

    const clickDropOff = ((metrics.impressions - metrics.clicks) / metrics.impressions) * 100;
    const conversionDropOff = ((metrics.clicks - metrics.conversions) / metrics.clicks) * 100;

    return {
      stages: [
        { label: "Impressions", value: Math.round(metrics.impressions) },
        { label: "Clicks", value: Math.round(metrics.clicks), dropOff: clickDropOff },
        { label: "Conversions", value: Math.round(metrics.conversions), dropOff: conversionDropOff },
      ],
      metrics,
      ctr: ((metrics.clicks / metrics.impressions) * 100).toFixed(2),
      cvr: ((metrics.conversions / metrics.clicks) * 100).toFixed(2),
    };
  };

  const platformFunnels = {
    google: calculateFunnel("google"),
    meta: calculateFunnel("meta"),
    dv360: calculateFunnel("dv360"),
  };

  const overallFunnel = calculateFunnel("all");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Conversion Funnel</h1>
        <p className="text-text-secondary">Track user journey from impressions to conversions</p>
      </div>

      {/* Platform Filter */}
      <div className="card flex gap-2 flex-wrap">
        {(["all", "google", "meta", "dv360"] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded transition-colors ${
              selectedPlatform === platform
                ? "bg-primary-500 text-white"
                : "bg-surface-hover text-text-secondary hover:bg-surface-elevated"
            }`}
          >
            {platform === "all" ? "All Platforms" : platform.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Overall Funnel */}
      {selectedPlatform === "all" && (
        <ChartContainer title="Overall Conversion Funnel">
          <div className="space-y-4">
            <FunnelChart stages={overallFunnel.stages} height={350} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border-primary">
              <div className="text-center">
                <p className="text-text-secondary text-sm">Click-Through Rate</p>
                <p className="text-3xl font-bold text-primary-400 mt-2">{overallFunnel.ctr}%</p>
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-sm">Conversion Rate</p>
                <p className="text-3xl font-bold text-accent-success mt-2">{overallFunnel.cvr}%</p>
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-sm">Total Conversions</p>
                <p className="text-3xl font-bold text-accent-gold mt-2">{overallFunnel.metrics.conversions.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </ChartContainer>
      )}

      {/* Platform-Specific Funnels */}
      {selectedPlatform !== "all" && (
        <ChartContainer title={`${selectedPlatform.toUpperCase()} Conversion Funnel`}>
          <div className="space-y-4">
            <FunnelChart
              stages={platformFunnels[selectedPlatform === "google" ? "google" : selectedPlatform === "meta" ? "meta" : "dv360"].stages}
              height={350}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border-primary">
              <div className="text-center">
                <p className="text-text-secondary text-sm">Click-Through Rate</p>
                <p className="text-3xl font-bold text-primary-400 mt-2">
                  {platformFunnels[selectedPlatform === "google" ? "google" : selectedPlatform === "meta" ? "meta" : "dv360"].ctr}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-sm">Conversion Rate</p>
                <p className="text-3xl font-bold text-accent-success mt-2">
                  {platformFunnels[selectedPlatform === "google" ? "google" : selectedPlatform === "meta" ? "meta" : "dv360"].cvr}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-sm">Total Conversions</p>
                <p className="text-3xl font-bold text-accent-gold mt-2">
                  {platformFunnels[selectedPlatform === "google" ? "google" : selectedPlatform === "meta" ? "meta" : "dv360"].metrics.conversions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </ChartContainer>
      )}

      {/* All Platform Funnels Grid */}
      {selectedPlatform === "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { name: "Google Ads", key: "google" as const, color: "bg-blue-500/10" },
            { name: "Meta", key: "meta" as const, color: "bg-purple-500/10" },
            { name: "DV360", key: "dv360" as const, color: "bg-orange-500/10" },
          ].map((platform) => (
            <div key={platform.key} className={`card ${platform.color}`}>
              <h3 className="text-lg font-bold text-text-primary mb-4">{platform.name}</h3>
              <FunnelChart stages={platformFunnels[platform.key as "google" | "meta" | "dv360"].stages} height={250} />
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border-primary/30">
                <div>
                  <p className="text-text-tertiary text-xs">CTR</p>
                  <p className="text-lg font-bold text-primary-400">{platformFunnels[platform.key as "google" | "meta" | "dv360"].ctr}%</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-xs">CVR</p>
                  <p className="text-lg font-bold text-accent-success">{platformFunnels[platform.key as "google" | "meta" | "dv360"].cvr}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
