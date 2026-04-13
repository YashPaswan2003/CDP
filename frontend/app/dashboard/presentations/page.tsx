"use client";

import { useState, useEffect } from "react";
import { Button, MetricBadge } from "@/components";
import { BarChart3, Download, Eye, Plus, Loader } from "lucide-react";
import { useAccount } from "@/lib/accountContext";

interface Presentation {
  id: string;
  title?: string;
  status: string;
  created_at: string;
  client_id: string;
  download_url?: string;
}

export default function PresentationsPage() {
  const account = useAccount();
  const accountId = account?.selectedAccount?.id || "";

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingModal, setGeneratingModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-31");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (accountId) {
      loadPresentations();
    }
  }, [accountId]);

  const loadPresentations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("account_id", accountId);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations?${params.toString()}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setPresentations(
          data.presentations.map((p: any) => ({
            ...p,
            title: p.title || `Report ${p.created_at?.substring(0, 10)}`,
          }))
        );
      } else {
        // Fallback to mock data if API not available
        setPresentations([
          {
            id: "pres_001",
            title: "Q1 2026 Performance Report",
            status: "ready",
            created_at: "2026-04-05",
            client_id: "client_001",
          },
        ]);
      }
    } catch (err) {
      console.warn("Failed to load presentations, using mock data");
      // Fallback to mock
      setPresentations([
        {
          id: "pres_001",
          title: "Q1 2026 Performance Report",
          status: "ready",
          created_at: "2026-04-05",
          client_id: "client_001",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePresentation = async () => {
    setGenerating(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      params.append("account_id", accountId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/generate?${params.toString()}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            client_id: "client_001",
            date_from: dateFrom,
            date_to: dateTo,
          }),
        }
      );

      if (response.ok) {
        const newPresentation = await response.json();
        setPresentations([newPresentation, ...presentations]);
        setGeneratingModal(false);
      } else {
        alert("Failed to generate presentation");
      }
    } catch (err) {
      console.error("Error generating presentation:", err);
      alert("Error generating presentation");
    } finally {
      setGenerating(false);
    }
  };

  if (!accountId) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <p className="text-text-secondary">Please select an account to view presentations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Presentations</h1>
          <p className="text-text-secondary">Auto-generated performance reports and insights</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => setGeneratingModal(true)}>
          <Plus className="w-4 h-4" />
          Generate New
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Presentations Grid */}
      {!loading && presentations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((presentation) => (
            <div
              key={presentation.id}
              className="card group cursor-pointer hover:border-primary-500/50 hover:bg-surface-hover transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary-500/10">
                  <BarChart3 className="w-6 h-6 text-primary-500" />
                </div>
                <MetricBadge label={presentation.status} type="success" size="sm" />
              </div>

              {/* Card Content */}
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {presentation.title}
              </h3>
              <p className="text-sm text-text-secondary mb-4">{presentation.client_id}</p>
              <p className="text-xs text-text-tertiary mb-6">Created {presentation.created_at?.substring(0, 10)}</p>

              {/* Card Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingId(presentation.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm rounded transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => {
                    const element = document.createElement("a");
                    element.href = "data:text/plain,Presentation Download (Phase 1 feature)";
                    element.download = `${presentation.title}.txt`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
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

      {/* No Presentations State */}
      {!loading && presentations.length === 0 && (
        <div className="text-center py-12 bg-surface-base rounded-lg border border-border-primary">
          <BarChart3 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary mb-4">No presentations yet</p>
          <Button variant="primary" onClick={() => setGeneratingModal(true)}>
            Create First Presentation
          </Button>
        </div>
      )}

      {/* Generate Presentation Modal */}
      {generatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-elevated rounded-lg p-8 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Generate Presentation</h2>
              <button
                onClick={() => setGeneratingModal(false)}
                className="text-text-tertiary hover:text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-border-primary rounded bg-surface-base text-text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-border-primary rounded bg-surface-base text-text-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setGeneratingModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleGeneratePresentation} disabled={generating}>
                {generating && <Loader className="w-4 h-4 animate-spin mr-2" />}
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Presentation Modal */}
      {viewingId && presentations.find((p) => p.id === viewingId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-elevated rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-auto space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">
                {presentations.find((p) => p.id === viewingId)?.title}
              </h2>
              <button
                onClick={() => setViewingId(null)}
                className="text-text-tertiary hover:text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-text-secondary">
              <p>
                <span className="text-text-primary font-medium">Client:</span>{" "}
                {presentations.find((p) => p.id === viewingId)?.client_id}
              </p>
              <p>
                <span className="text-text-primary font-medium">Created:</span>{" "}
                {presentations.find((p) => p.id === viewingId)?.created_at}
              </p>
              <p>
                <span className="text-text-primary font-medium">Status:</span>{" "}
                <span className="inline-block ml-2 px-2 py-1 bg-accent-success/20 text-accent-success rounded text-sm">
                  {presentations.find((p) => p.id === viewingId)?.status}
                </span>
              </p>
            </div>

            <div className="bg-surface-base rounded p-4 mt-6">
              <p className="text-text-secondary text-sm">
                Full presentation content would load here in Phase 1. This is a preview modal showing the presentation metadata.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setViewingId(null)}>
                Close
              </Button>
              <Button variant="primary" className="flex-1">
                Open in Editor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
