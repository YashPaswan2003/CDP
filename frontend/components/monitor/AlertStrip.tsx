"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildCampaignDeepLink } from "@/lib/analytics";

export interface Alert {
  id: string;
  severity: 'error' | 'warning' | 'success';
  message: string;
  campaign?: string;
  platform?: string;
  targetPage?: string; // e.g., '/dashboard/analytics/google-ads/campaigns'
}

interface AlertStripProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  accountId?: string;  // Account ID for deep-links
  dateFrom?: string;   // Date range start (YYYY-MM-DD)
  dateTo?: string;     // Date range end (YYYY-MM-DD)
}

/**
 * AlertStrip Component
 *
 * Displays 2-4 health alerts for a marketing account.
 * Color-coded by severity: red (error), amber (warning), green (success).
 * Each alert is dismissable via the [X] button and clickable to navigate to analytics pages.
 *
 * Displays nothing when alerts array is empty.
 */
export function AlertStrip({ alerts, onDismiss, accountId, dateFrom, dateTo }: AlertStripProps) {
  const router = useRouter();
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Color mappings for severity levels
  const severityStyles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: '🔴',
      text: 'text-red-800',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: '🟡',
      text: 'text-amber-800',
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: '✅',
      text: 'text-green-800',
    },
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

        const handleViewAlert = () => {
          if (alert.platform && alert.campaign) {
            const deepLink = buildCampaignDeepLink(
              alert.platform as 'google' | 'dv360' | 'meta',
              alert.campaign,
              {
                accountId,
                dateFrom,
                dateTo,
              }
            );
            router.push(deepLink);
          } else if (alert.targetPage) {
            router.push(alert.targetPage);
          }
        };

        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border ${styles.container}`}
          >
            <div className={`flex items-center gap-3 ${styles.text} text-sm flex-1`}>
              <span className="text-base">{styles.icon}</span>
              <span className="font-medium">{alert.message}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              {((alert.platform && alert.campaign) || alert.targetPage) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewAlert}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${styles.text} hover:bg-white/20`}
                  aria-label={`View details for: ${alert.message}`}
                >
                  View
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDismiss(alert.id)}
                className={`flex-shrink-0 p-1 rounded hover:bg-white/30 transition-colors ${styles.text}`}
                aria-label={`Dismiss alert: ${alert.message}`}
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
