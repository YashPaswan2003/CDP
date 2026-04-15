'use client';

import { useState, useEffect } from 'react';
import { getFlags, executeAction } from '@/lib/api';
import { AlertCircle, AlertTriangle, CheckCircle, ChevronRight, Shield } from 'lucide-react';
import Link from 'next/link';

interface MonitorDiagnoseActProps {
  accountId?: string;
}

interface Flag {
  metric: string;
  current?: number;
  previous?: number;
  entities: string[];
  entity_count: number;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  campaign_name?: string;
  client_name?: string;
  platform?: string;
  actions: { type: string; label: string; severity: string }[];
}


export function MonitorDiagnoseAct({ accountId }: MonitorDiagnoseActProps) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [severityDistribution, setSeverityDistribution] = useState<{ high?: number; medium?: number; low?: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadFlags = async () => {
    if (!accountId) {
      setError('No account selected');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getFlags(accountId);
      setFlags(response.flags || []);
      setSeverityDistribution(response.severity_distribution || {});
    } catch (err) {
      setError('Failed to load flags. Please try again.');
      console.error('Error loading flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const handleAction = async (flag: Flag, action: { type: string; label: string }) => {
    if (!accountId) return;
    try {
      const entityId = flag.entities?.[0] || flag.metric;
      const entityType = flag.entities?.length > 0 ? 'campaign' : 'metric';
      const parameters = action.type === 'adjust_bid'
        ? { old_bid: 'current', new_bid: 'optimized' }
        : action.type === 'increase_budget'
        ? { old_budget: 'current', new_budget: 'increased' }
        : undefined;

      const result = await executeAction(accountId, action.type, entityType, entityId, parameters);
      if (result.success) {
        setToast({ type: 'success', message: `${action.label} executed successfully` });
        setTimeout(() => loadFlags(), 1500);
      } else {
        setToast({ type: 'error', message: result.message || 'Action failed' });
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to execute action' });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    loadFlags().finally(() => setRetrying(false));
  };

  const criticalCount = severityDistribution.high || 0;
  const warningCount = severityDistribution.medium || 0;
  const healthyCount = severityDistribution.low || 0;

  const criticalFlags = flags.filter(f => f.severity === 'high');
  const warningFlags = flags.filter(f => f.severity === 'medium');
  const healthyFlags = flags.filter(f => f.severity === 'low');

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            Monitor / Diagnose / Act
          </h2>
          <span className="text-sm text-text-secondary">Loading alerts...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface-elevated h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          Monitor / Diagnose / Act
        </h2>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-lg p-3 flex items-center gap-3`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          Monitor / Diagnose / Act
        </h2>
        <Link
          href="/dashboard/monitor"
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
        >
          View All Flags <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Critical */}
        <Link href="/dashboard/monitor/critical" className="block">
          <div className="card border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-sm font-medium text-red-400">Critical</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">{criticalCount}</p>
            <p className="text-xs text-text-secondary mt-1">items need attention</p>
          </div>
        </Link>

        {/* Warning */}
        <Link href="/dashboard/monitor/warning" className="block">
          <div className="card border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-amber-400">Warning</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">{warningCount}</p>
            <p className="text-xs text-text-secondary mt-1">items to review</p>
          </div>
        </Link>

        {/* Healthy */}
        <Link href="/dashboard/monitor/healthy" className="block">
          <div className="card border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-emerald-400">On Track</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">{healthyCount}</p>
            <p className="text-xs text-text-secondary mt-1">items running well</p>
          </div>
        </Link>
      </div>

      {/* Preview Lists */}
      {flags.length === 0 ? (
        <div className="card text-center py-8">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-text-primary font-medium">No anomalies detected</p>
          <p className="text-xs text-text-secondary mt-1">Your campaigns are running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Critical Preview */}
          {criticalFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">Critical ({criticalCount})</h3>
              </div>
              <div className="space-y-2">
                {criticalFlags.slice(0, 3).map((flag, i) => (
                  <div key={`critical-${i}`} className="card border-l-2 border-l-red-500 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">
                          <span className="font-medium capitalize">{flag.metric.replace(/_/g, ' ')}</span>
                          {flag.current != null && (
                            <span className="text-text-secondary"> — {flag.current.toFixed(2)}</span>
                          )}
                          {flag.previous != null && (
                            <span className="text-text-secondary"> (was {flag.previous.toFixed(2)})</span>
                          )}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5 truncate">{flag.explanation}</p>
                      </div>
                      <div className="flex gap-2 ml-3 flex-shrink-0">
                        {flag.actions.slice(0, 1).map((action) => (
                          <button
                            key={action.type}
                            onClick={() => handleAction(flag, action)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {criticalCount > 3 && (
                  <Link
                    href="/dashboard/monitor/critical"
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 pl-4"
                  >
                    View all {criticalCount} critical <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Warning Preview */}
          {warningFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-400">Warning ({warningCount})</h3>
              </div>
              <div className="space-y-2">
                {warningFlags.slice(0, 2).map((flag, i) => (
                  <div key={`warning-${i}`} className="card border-l-2 border-l-amber-500 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">
                          <span className="font-medium capitalize">{flag.metric.replace(/_/g, ' ')}</span>
                          {flag.current != null && (
                            <span className="text-text-secondary"> — {flag.current.toFixed(2)}</span>
                          )}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5 truncate">{flag.explanation}</p>
                      </div>
                      <div className="flex gap-2 ml-3 flex-shrink-0">
                        {flag.actions.slice(0, 1).map((action) => (
                          <button
                            key={action.type}
                            onClick={() => handleAction(flag, action)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {warningCount > 2 && (
                  <Link
                    href="/dashboard/monitor/warning"
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 pl-4"
                  >
                    View all {warningCount} warnings <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Healthy Preview */}
          {healthyFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">On Track ({healthyCount})</h3>
              </div>
              <Link
                href="/dashboard/monitor/healthy"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pl-4"
              >
                View all {healthyCount} on-track items <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
