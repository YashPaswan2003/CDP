import { AnalyticsBuilder } from "./client";

export function generateStaticParams() {
  return [
    { platform: "google-ads" },
    { platform: "dv360" },
    { platform: "meta" },
  ];
}

export default function AnalyticsPlatformPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Analytics Breakdown</h1>
        <p className="text-text-secondary">Multi-dimensional performance analysis with sortable columns</p>
      </div>
      <AnalyticsBuilder />
    </div>
  );
}
