"use client";

import { useState, useEffect } from "react";
import { useAccount } from "@/lib/accountContext";
import { getFlags, executeAction } from "@/lib/api";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ExternalLink,
  Play,
  Pause,
  TrendingUp,
  DollarSign,
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

const severityMap: Record<string, "high" | "medium" | "low"> = {
  critical: "high",
  warning: "medium",
  healthy: "low",
};

const severityConfig: Record<
  string,
  {
    icon: typeof AlertCircle;
    label: string;
    color: string;
    bgClass: string;
    borderClass: string;
    btnClass: string;
    badgeClass: string;
  }
> = {
  critical: {
    icon: AlertCircle,
    label: "Critical",
    color: "red",
    bgClass: "bg-red-500/5",
    borderClass: "border-red-500/30",
    btnClass: "bg-red-600 hover:bg-red-700",
    badgeClass: "bg-red-500/20 text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "amber",
    bgClass: "bg-amber-500/5",
    borderClass: "border-amber-500/30",
    btnClass: "bg-amber-600 hover:bg-amber-700",
    badgeClass: "bg-amber-500/20 text-amber-400",
  },
  healthy: {
    icon: CheckCircle,
    label: "On Track",
    color: "emerald",
    bgClass: "bg-emerald-500/5",
    borderClass: "border-emerald-500/30",
    btnClass: "bg-emerald-600 hover:bg-emerald-700",
    badgeClass: "bg-emerald-500/20 text-emerald-400",
  },
};

const platformLinks: Record<string, string> = {
  google: "/dashboard/analytics/google-ads",
  dv360: "/dashboard/analytics/dv360",
  meta: "/dashboard/analytics/meta",
};

export function MonitorDrilldownClient() {
  const params = useParams();
  const severitySlug = (params?.severity as string) || "critical";
  const { selectedAccount } = useAccount();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const apiSeverity = severityMap[severitySlug] || "high";
  const config = severityConfig[severitySlug] || severityConfig.critical;
  const Icon = config.icon;

  const loadFlags = async () => {
    if (!selectedAccount?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getFlags(selectedAccount.id);
      const allFlags: Flag[] = response.flags || [];
      setFlags(allFlags.filter((f) => f.severity === apiSeverity));
    } catch {
      setError("Failed to load flags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.id, apiSeverity]);

  const handleAction = async (flag: Flag, action: { type: string; label: string }) => {
    if (!selectedAccount?.id) return;
    try {
      const entityId = flag.entities?.[0] || flag.metric;
      const entityType = flag.entities?.length > 0 ? "campaign" : "metric";
      const parameters =
        action.type === "adjust_bid"
          ? { old_bid: "current", new_bid: "optimized" }
          : action.type === "increase_budget"
          ? { old_budget: "current", new_budget: "increased" }
          : undefined;

      const result = await executeAction(selectedAccount.id, action.type, entityType, entityId, parameters);
      if (result.success) {
        setToast({ type: "success", message: `${action.label} executed successfully` });
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

  const filteredFlags = platformFilter === "all" ? flags : flags.filter((f) => f.platform === platformFilter);
  const platformTabs = [
    { value: "all", label: "All" },
    { value: "google", label: "Google Ads" },
    { value: "dv360", label: "DV360" },
    { value: "meta", label: "Meta" },
  ];

  const getActionIcon = (type: string) => {
    switch (type) {
      case "pause": return <Pause className="w-3 h-3" />;
      case "resume": return <Play className="w-3 h-3" />;
      case "adjust_bid": return <TrendingUp className="w-3 h-3" />;
      case "increase_budget": return <DollarSign className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"} border rounded-lg p-3 flex items-center gap-3`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <p className={`text-sm font-medium ${toast.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{toast.message}</p>
        </div>
      )}

      <div>
        <Link href="/dashboard/monitor" className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1 mb-3 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Monitor Overview
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${config.bgClass} border ${config.borderClass} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${config.color}-400`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{config.label} Items</h1>
            <p className="text-text-secondary">{filteredFlags.length} item{filteredFlags.length !== 1 ? "s" : ""} | {selectedAccount?.name}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border-primary">
        {platformTabs.map((tab) => (
          <button key={tab.value} onClick={() => setPlatformFilter(tab.value)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${platformFilter === tab.value ? "border-primary-500 text-primary-400" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-surface-elevated h-28 rounded-lg" />)}
        </div>
      )}

      {error && !loading && (
        <div className="card bg-red-500/10 border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => loadFlags()} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && filteredFlags.length === 0 && (
        <div className="card text-center py-12">
          <Icon className={`w-10 h-10 text-${config.color}-400 mx-auto mb-3`} />
          <p className="text-text-primary font-medium">No {config.label.toLowerCase()} items found</p>
          <p className="text-sm text-text-secondary mt-1">
            {platformFilter !== "all" ? `No ${config.label.toLowerCase()} items for the selected platform.` : "Great news — nothing to act on here."}
          </p>
        </div>
      )}

      {!loading && !error && filteredFlags.length > 0 && (
        <div className="space-y-3">
          {filteredFlags.map((flag, i) => (
            <div key={`${flag.metric}-${i}`} className={`card border ${config.borderClass} ${config.bgClass}`}>
              <div className="flex items-start gap-4">
                <Icon className={`w-5 h-5 text-${config.color}-400 flex-shrink-0 mt-1`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary capitalize">{flag.metric.replace(/_/g, " ")}</h3>
                      {flag.campaign_name && (
                        <p className="text-sm text-text-secondary">{flag.campaign_name}{flag.client_name && ` — ${flag.client_name}`}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${config.badgeClass}`}>{config.label.toUpperCase()}</span>
                  </div>

                  {flag.current != null && (
                    <div className="flex items-center gap-4 mt-3">
                      <div><p className="text-xs text-text-secondary">Current</p><p className="text-lg font-bold text-text-primary">{flag.current.toFixed(2)}</p></div>
                      {flag.previous != null && (<div><p className="text-xs text-text-secondary">Previous</p><p className="text-lg font-bold text-text-secondary">{flag.previous.toFixed(2)}</p></div>)}
                      {flag.previous != null && flag.previous !== 0 && (
                        <div><p className="text-xs text-text-secondary">Change</p>
                          <p className={`text-lg font-bold ${flag.current < flag.previous ? "text-red-400" : "text-emerald-400"}`}>
                            {(((flag.current - flag.previous) / flag.previous) * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-text-secondary mt-2">{flag.explanation}</p>

                  {flag.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {flag.entities.slice(0, 5).map((e) => (
                        <span key={e} className="px-2 py-0.5 bg-surface-base rounded text-xs text-text-secondary border border-border-primary">{e}</span>
                      ))}
                      {flag.entities.length > 5 && <span className="text-xs text-text-secondary">+{flag.entities.length - 5} more</span>}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {flag.actions.map((action) => (
                      <button key={action.type} onClick={() => handleAction(flag, action)}
                        className={`px-4 py-2 ${config.btnClass} text-white text-sm font-medium rounded transition-colors flex items-center gap-1.5`}>
                        {getActionIcon(action.type)} {action.label}
                      </button>
                    ))}
                    {flag.platform && platformLinks[flag.platform] && (
                      <Link href={platformLinks[flag.platform]}
                        className="px-4 py-2 bg-surface-base hover:bg-surface-elevated border border-border-primary text-text-primary text-sm font-medium rounded transition-colors flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3" /> View Campaign
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
