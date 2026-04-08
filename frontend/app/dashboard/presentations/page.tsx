"use client";

import { useState } from "react";
import { Button, MetricBadge } from "@/components";
import { BarChart3, Download, Eye, Plus } from "lucide-react";

export default function PresentationsPage() {
  const [viewingId, setViewingId] = useState<number | null>(null);

  const presentations = [
    { id: 1, title: "Q1 2026 Performance Report", created: "2026-04-05", client: "TechStore E-commerce", status: "ready" },
    { id: 2, title: "March Campaign Analysis", created: "2026-03-31", client: "TechStore E-commerce", status: "ready" },
    { id: 3, title: "Real Estate Portfolio Review", created: "2026-04-01", client: "RealEstate Luxury", status: "ready" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Presentations</h1>
          <p className="text-text-secondary">Auto-generated performance reports and insights</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => alert("Generate presentation feature coming in Phase 1")}>
          <Plus className="w-4 h-4" />
          Generate New
        </Button>
      </div>

      {/* Presentations Grid */}
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
            <p className="text-sm text-text-secondary mb-4">{presentation.client}</p>
            <p className="text-xs text-text-tertiary mb-6">Created {presentation.created}</p>

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

      {/* View Presentation Modal */}
      {viewingId && (
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
                {presentations.find((p) => p.id === viewingId)?.client}
              </p>
              <p>
                <span className="text-text-primary font-medium">Created:</span>{" "}
                {presentations.find((p) => p.id === viewingId)?.created}
              </p>
              <p>
                <span className="text-text-primary font-medium">Status:</span>{" "}
                <span className="inline-block ml-2 px-2 py-1 bg-accent-success/20 text-accent-success rounded text-sm">
                  Ready
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
