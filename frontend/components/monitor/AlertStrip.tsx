"use client";

import { motion } from "framer-motion";
import { X, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export interface Alert {
  id: string;
  severity: 'error' | 'warning' | 'success';
  headline: string;
  context?: string;
  message?: string; // legacy fallback
  campaign?: string;
  platform?: string;
  metric?: string;
  targetPage?: string;
}

interface AlertStripProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * AlertStrip Component
 *
 * Displays health alerts with severity-coded left border, Lucide icons,
 * campaign-specific headlines, context lines, and [View Details] deep links.
 */
export function AlertStrip({ alerts, onDismiss, accountId, dateFrom, dateTo }: AlertStripProps) {
  const router = useRouter();
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const severityStyles = {
    error: {
      border: 'border-l-red-500',
      bg: 'bg-red-950/20',
      iconColor: 'text-red-400',
      textColor: 'text-red-300',
      contextColor: 'text-red-400/70',
      Icon: AlertCircle,
    },
    warning: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-950/20',
      iconColor: 'text-amber-400',
      textColor: 'text-amber-300',
      contextColor: 'text-amber-400/70',
      Icon: AlertTriangle,
    },
    success: {
      border: 'border-l-green-500',
      bg: 'bg-green-950/20',
      iconColor: 'text-green-400',
      textColor: 'text-green-300',
      contextColor: 'text-green-400/70',
      Icon: CheckCircle,
    },
  };

  const buildViewUrl = (alert: Alert): string | null => {
    if (alert.targetPage) return alert.targetPage;
    if (!alert.platform) return null;
    const platformPaths: Record<string, string> = {
      google: '/dashboard/analytics/google-ads/campaigns',
      dv360: '/dashboard/analytics/dv360/campaigns',
      meta: '/dashboard/analytics/meta/campaigns',
    };
    const basePath = platformPaths[alert.platform];
    if (!basePath) return null;
    const params = new URLSearchParams();
    if (alert.campaign) params.set('campaign', alert.campaign);
    if (alert.metric) params.set('highlight', alert.metric);
    if (accountId) params.set('account_id', accountId);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2 mb-6"
    >
      {alerts.map((alert, idx) => {
        const styles = severityStyles[alert.severity];
        const IconComponent = styles.Icon;
        const viewUrl = buildViewUrl(alert);
        const displayHeadline = alert.headline || alert.message || "Alert";

        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 ${styles.border} ${styles.bg} border border-border-primary`}
          >
            <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${styles.iconColor}`} />

            <div className="flex-1 min-w-0 space-y-0.5">
              <p className={`text-sm font-semibold ${styles.textColor}`}>
                {displayHeadline}
              </p>
              {alert.context && (
                <p className={`text-xs ${styles.contextColor}`}>
                  {alert.context}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {viewUrl && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(viewUrl)}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-text-primary transition-colors"
                >
                  View Details
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded hover:bg-white/10 transition-colors text-text-secondary"
                aria-label={`Dismiss alert: ${displayHeadline}`}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
