'use client';

import { useState, useEffect } from 'react';
import { getFlags, executeAction } from '@/lib/api';
import { FlagBanner } from './FlagBanner';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MonitorDiagnoseActProps {
  accountId?: string;
}

export function MonitorDiagnoseAct({ accountId }: MonitorDiagnoseActProps) {
  const [flags, setFlags] = useState<any[]>([]);
  const [severityDistribution, setSeverityDistribution] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [, setActionLoading] = useState<string | null>(null);
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
  }, [accountId]);

  const handleAction = async (flag: any, action: any) => {
    if (!accountId) return;

    setActionLoading(action.type);
    try {
      // Use first entity if available, otherwise use flag metric as entity_id
      const entityId = flag.entities?.[0] || flag.metric;
      const entityType = flag.entities?.length > 0 ? 'campaign' : 'metric';

      const parameters = action.type === 'adjust_bid'
        ? { old_bid: 'current', new_bid: 'optimized' }
        : action.type === 'increase_budget'
        ? { old_budget: 'current', new_budget: 'increased' }
        : undefined;

      const result = await executeAction(
        accountId,
        action.type,
        entityType,
        entityId,
        parameters,
      );

      if (result.success) {
        setToast({
          type: 'success',
          message: `${action.label} executed successfully`,
        });
        // Reload flags after action
        setTimeout(() => loadFlags(), 1500);
      } else {
        setToast({
          type: 'error',
          message: result.message || 'Action failed',
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to execute action',
      });
      console.error('Action execution error:', err);
    } finally {
      setActionLoading(null);
      // Auto-dismiss toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    loadFlags().finally(() => setRetrying(false));
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Monitor • Diagnose • Act</h2>
          <div className="text-sm text-gray-500">Loading alerts...</div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Monitor • Diagnose • Act</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm text-red-900 font-medium">{error}</p>
          </div>
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

  // No flags state
  if (flags.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Monitor • Diagnose • Act</h2>
          <div className="text-sm text-gray-500">✓ All clear</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-sm text-green-900 font-medium">No anomalies detected</p>
          <p className="text-xs text-green-700 mt-1">Your campaigns are running smoothly. Check back soon for updates.</p>
        </div>
      </div>
    );
  }

  // Flags state
  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div className={`${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 flex items-center gap-3`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Monitor • Diagnose • Act</h2>
        <div className="flex items-center gap-4">
          {/* Severity Distribution */}
          <div className="flex gap-3 text-sm">
            {severityDistribution.high > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span className="text-gray-700">{severityDistribution.high} HIGH</span>
              </span>
            )}
            {severityDistribution.medium > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span className="text-gray-700">{severityDistribution.medium} MEDIUM</span>
              </span>
            )}
            {severityDistribution.low > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-gray-700">{severityDistribution.low} LOW</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Flags List */}
      <div className="space-y-3">
        {flags.map((flag) => (
          <FlagBanner
            key={flag.metric}
            {...flag}
            onAction={(action) => handleAction(flag, action)}
          />
        ))}
      </div>
    </div>
  );
}
