"use client";

import { useState, useEffect } from "react";
import { useAccount } from "@/lib/accountContext";
import { getFlags, executeAction } from "@/lib/api";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Shield,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface Flag {
  metric: string;
  current?: number;
  previous?: number;
  entities: string[];
  entity_count: number;
  severity: "high" | "medium" | "low";
  explanation: string;
  campaign_name?: string;
  client_name?: string;
  platform?: string;
  actions: { type: string; label: string; severity: string }[];
}

export default function MonitorOverviewPage() {
  const { selectedAccount } = useAccount();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [severityDistribution, setSeverityDistribution] = useState<{
    high?: number;
    medium?: number;
    low?: number;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadFlags = async () => {
    if (!selectedAccount?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getFlags(selectedAccount.id);
      setFlags(response.flags || []);
      setSeverityDistribution(response.severity_distribution || {});
    } catch {
      setError("Failed to load flags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.id]);

  const handleAction = async (
    flag: Flag,
    action: { type: string; label: string }
  ) => {
    if (!selectedAccount?.id) return;
    try {
      const entityId = flag.entities?.[0] || flag.metric;
      const entityType = flag.entities?.length > 0 ? "campaign" : "metric";
      const result = await executeAction(
        selectedAccount.id,
        action.type,
        entityType,
        entityId
      );
      if (result.success) {
        setToast({
          type: "success",
          message: `${action.label} executed successfully`,
        });
        setTimeout(() => loadFlags(), 1500);
      } else {
        setToast({ type: "error", message: result.message || "Action failed" });
      }
    } catch {
      setToast({ type: "error", message: "Failed to execute action" });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const criticalCount = severityDistribution.high || 0;
  const warningCount = severityDistribution.medium || 0;
  const healthyCount = severityDistribution.low || 0;

  const criticalFlags = flags.filter((f) => f.severity === "high");
  const warningFlags = flags.filter((f) => f.severity === "medium");
  const healthyFlags = flags.filter((f) => f.severity === "low");

  const severityConfig = {
    high: {
      icon: AlertCircle,
      color: "red",
      label: "Critical",
      btnClass: "bg-red-600 hover:bg-red-700",
      borderClass: "border-l-red-500",
    },
    medium: {
      icon: AlertTriangle,
      color: "amber",
      label: "Warning",
      btnClass: "bg-amber-600 hover:bg-amber-700",
      borderClass: "border-l-amber-500",
    },
    low: {
      icon: CheckCircle,
      color: "emerald",
      label: "On Track",
      btnClass: "bg-emerald-600 hover:bg-emerald-700",
      borderClass: "border-l-emerald-500",
    },
  };

  const renderFlagCard = (flag: Flag, index: number) => {
    const cfg = severityConfig[flag.severity];
    const Icon = cfg.icon;
    return (
      <div
        key={`${flag.severity}-${index}`}
        className={`card border-l-2 ${cfg.borderClass} py-4 px-5`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className={`w-5 h-5 text-${cfg.color}-400 flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary capitalize">
                {flag.metric.replace(/_/g, " ")}
                {flag.current != null && (
                  <span className="font-normal text-text-secondary">
                    {" "}
                    — {flag.current.toFixed(2)}
                    {flag.previous != null && ` (was ${flag.previous.toFixed(2)})`}
                  </span>
                )}
              </p>
              <p className="text-xs text-text-secondary mt-1">{flag.explanation}</p>
              {flag.entities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {flag.entities.slice(0, 3).map((e) => (
                    <span
                      key={e}
                      className="px-2 py-0.5 bg-surface-base rounded text-xs text-text-secondary border border-border-primary"
                    >
                      {e}
                    </span>
                  ))}
                  {flag.entities.length > 3 && (
                    <span className="text-xs text-text-secondary">
                      +{flag.entities.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {flag.actions.slice(0, 2).map((action) => (
              <button
                key={action.type}
                onClick={() => handleAction(flag, action)}
                className={`px-3 py-1.5 ${cfg.btnClass} text-white text-xs font-medium rounded transition-colors`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          } border rounded-lg p-3 flex items-center gap-3`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <p
            className={`text-sm font-medium ${
              toast.type === "success" ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {toast.message}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary-400" />
            Monitor / Diagnose / Act
          </h1>
          <p className="text-text-secondary mt-1">
            Account: {selectedAccount?.name}
          </p>
        </div>
        <button
          onClick={() => loadFlags()}
          disabled={loading}
          className="px-4 py-2 bg-surface-elevated hover:bg-surface-base border border-border-primary rounded-lg text-sm text-text-primary flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/monitor/critical" className="block">
          <div className="card border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm font-semibold text-red-400">
                Critical
              </span>
            </div>
            <p className="text-4xl font-bold text-text-primary">
              {criticalCount}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-text-secondary">items need attention</p>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/monitor/warning" className="block">
          <div className="card border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-amber-400">
                Warning
              </span>
            </div>
            <p className="text-4xl font-bold text-text-primary">
              {warningCount}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-text-secondary">items to review</p>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/monitor/healthy" className="block">
          <div className="card border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-emerald-400">
                On Track
              </span>
            </div>
            <p className="text-4xl font-bold text-text-primary">
              {healthyCount}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-text-secondary">items running well</p>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="card bg-red-500/10 border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button
            onClick={() => loadFlags()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Flag Sections */}
      {!loading && !error && flags.length === 0 && (
        <div className="card text-center py-12">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-text-primary font-medium">All systems running smoothly</p>
          <p className="text-sm text-text-secondary mt-1">
            No anomalies detected across your campaigns.
          </p>
        </div>
      )}

      {/* Critical */}
      {criticalFlags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Critical ({criticalCount})
            </h2>
            <Link
              href="/dashboard/monitor/critical"
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {criticalFlags.map((flag, i) => renderFlagCard(flag, i))}
          </div>
        </div>
      )}

      {/* Warning */}
      {warningFlags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Warning ({warningCount})
            </h2>
            <Link
              href="/dashboard/monitor/warning"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {warningFlags.map((flag, i) => renderFlagCard(flag, i))}
          </div>
        </div>
      )}

      {/* Healthy */}
      {healthyFlags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              On Track ({healthyCount})
            </h2>
            <Link
              href="/dashboard/monitor/healthy"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {healthyFlags.map((flag, i) => renderFlagCard(flag, i))}
          </div>
        </div>
      )}
    </div>
  );
}
