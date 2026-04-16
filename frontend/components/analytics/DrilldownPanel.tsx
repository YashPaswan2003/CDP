"use client";

import { useEffect, useRef } from "react";

interface DrilldownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityTab: string;
  allData: Record<string, Array<{ name: string; [key: string]: number | string }>>;
  currency?: string;
}

// Format helpers
function formatSpend(num: number, cur: string): string {
  const lakhs = num / 100000;
  return `${cur}${lakhs.toFixed(1)}L`;
}

function formatROAS(num: number): string {
  return `${num.toFixed(1)}x`;
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}

/**
 * Generate synthetic breakdown rows for a given entity within a dimension tab.
 * Since we don't have real cross-dimensional data, we derive plausible numbers
 * from the existing tab data, seeded by the entity name for consistency.
 */
function syntheticBreakdown(
  entityName: string,
  _tabKey: string,
  tabRows: Array<{ name: string; [key: string]: number | string }>
): Array<{ name: string; spend: number; roas: number; conversions: number }> {
  // Simple hash from entity name to create consistent variation
  let hash = 0;
  for (let i = 0; i < entityName.length; i++) {
    hash = ((hash << 5) - hash + entityName.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);

  return tabRows
    .map((row, idx) => {
      // Create a variation factor based on entity name + row position
      const factor = 0.4 + ((seed + idx * 37) % 60) / 100;
      const spend = typeof row.spend === "number" ? row.spend * factor : 0;
      const roas = typeof row.roas === "number" ? row.roas * (0.8 + ((seed + idx * 13) % 40) / 100) : 0;
      const conversions =
        typeof row.conversions === "number" ? Math.round(row.conversions * factor) : 0;
      return {
        name: String(row.name),
        spend,
        roas,
        conversions,
      };
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);
}

export default function DrilldownPanel({
  isOpen,
  onClose,
  entityName,
  entityTab,
  allData,
  currency,
}: DrilldownPanelProps) {
  const cur = currency || "₹";
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Get all tabs except the active one
  const otherTabs = Object.keys(allData).filter((tab) => tab !== entityTab);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-[420px] max-w-[90vw] bg-surface-base border-l border-border-primary shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border-primary">
          <div className="min-w-0 pr-4">
            <h2 className="text-lg font-bold text-text-primary truncate">{entityName}</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              from <span className="text-primary-400">{entityTab}</span> breakdown
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Close panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(100vh-140px)] p-5 space-y-6">
          {otherTabs.map((tabKey) => {
            const tabRows = allData[tabKey] || [];
            if (tabRows.length === 0) return null;

            const rows = syntheticBreakdown(entityName, tabKey, tabRows);

            return (
              <div key={tabKey}>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  By {tabKey}
                </h3>
                <div className="overflow-hidden rounded-lg border border-border-primary">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-elevated">
                        <th className="px-3 py-2 text-left text-text-secondary font-medium text-xs">
                          Name
                        </th>
                        <th className="px-3 py-2 text-right text-text-secondary font-medium text-xs">
                          Spend
                        </th>
                        <th className="px-3 py-2 text-right text-text-secondary font-medium text-xs">
                          ROAS
                        </th>
                        <th className="px-3 py-2 text-right text-text-secondary font-medium text-xs">
                          Conv.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr
                          key={row.name}
                          className={`border-t border-border-primary ${
                            i % 2 === 0 ? "bg-surface-elevated/50" : "bg-surface-base"
                          }`}
                        >
                          <td className="px-3 py-2 text-text-primary font-medium truncate max-w-[140px]">
                            {row.name}
                          </td>
                          <td className="px-3 py-2 text-right text-text-secondary">
                            {formatSpend(row.spend, cur)}
                          </td>
                          <td className="px-3 py-2 text-right text-text-secondary">
                            {formatROAS(row.roas)}
                          </td>
                          <td className="px-3 py-2 text-right text-text-secondary">
                            {formatNumber(row.conversions)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-primary bg-surface-base">
          <button className="text-sm text-primary-400 hover:text-primary-500 font-medium transition-colors">
            View full breakdown &rarr;
          </button>
        </div>
      </div>
    </>
  );
}
