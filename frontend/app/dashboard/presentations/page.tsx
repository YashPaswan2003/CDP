"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, MetricBadge } from "@/components";
import {
  BarChart3,
  Download,
  ExternalLink,
  Plus,
  Loader,
  Calendar,
  FileText,
  Presentation,
} from "lucide-react";
import { useAccount } from "@/lib/accountContext";

interface PresentationItem {
  id: string;
  title: string;
  client_id: string;
  client_name: string;
  date_from: string;
  date_to: string;
  template_type: string;
  status: string;
  slide_count: number;
  created_at: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  monthly_performance: "Monthly Report",
  campaign_deep_dive: "Campaign Deep Dive",
  client_qbr: "Quarterly Review",
  weekly_pulse: "Weekly Pulse",
};

export default function PresentationsPage() {
  const account = useAccount();
  const accountId = account?.selectedAccount?.id || "";
  const router = useRouter();

  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accountId) loadPresentations();
  }, [accountId]);

  const loadPresentations = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({ account_id: accountId });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations?${params}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setPresentations(data.presentations || []);
      } else {
        setPresentations([]);
      }
    } catch {
      setPresentations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({ account_id: accountId });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/${id}/download?${params}`,
        { headers }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `presentation_${id}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (!accountId) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Please select an account to view presentations</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Presentations</h1>
          <p className="text-text-secondary">
            Auto-generated performance reports with real campaign data
          </p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => router.push("/dashboard/presentations/new")}
        >
          <Plus className="w-4 h-4" />
          New Presentation
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Presentations Grid */}
      {!loading && presentations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((pres) => (
            <div
              key={pres.id}
              className="card group hover:border-primary-500/50 hover:bg-surface-hover transition-all"
            >
              {/* Card top */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary-500/10">
                  <Presentation className="w-6 h-6 text-primary-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-base text-text-tertiary border border-border-primary">
                    {TEMPLATE_LABELS[pres.template_type] || pres.template_type}
                  </span>
                  <MetricBadge
                    label={pres.status}
                    type={pres.status === "ready" ? "success" : "warning"}
                    size="sm"
                  />
                </div>
              </div>

              {/* Card content */}
              <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-2">
                {pres.title}
              </h3>
              <p className="text-sm text-text-secondary mb-1">{pres.client_name}</p>
              <div className="flex items-center gap-3 text-xs text-text-tertiary mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {pres.date_from} - {pres.date_to}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {pres.slide_count} slides
                </span>
              </div>
              <p className="text-xs text-text-tertiary mb-5">
                Created {pres.created_at?.substring(0, 10)}
              </p>

              {/* Card actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/presentations/${pres.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm rounded transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>
                <button
                  onClick={() => handleDownload(pres.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface-hover border border-border-primary hover:bg-surface-elevated text-text-primary font-medium text-sm rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && presentations.length === 0 && (
        <div className="text-center py-16 bg-surface-base rounded-lg border border-border-primary">
          <BarChart3 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <p className="text-text-primary font-medium mb-2">No presentations yet</p>
          <p className="text-text-secondary text-sm mb-6">
            Create your first presentation from a template with real campaign data
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard/presentations/new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Presentation
          </Button>
        </div>
      )}
    </div>
  );
}
