"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildCampaignDeepLink } from "@/lib/analytics";

export interface Recommendation {
  id: string;
  platform: 'google' | 'meta' | 'dv360';
  campaign: string;
  issue: string;          // e.g., "ROAS 0.8x for 3 days"
  action: string;          // e.g., "Reduce budget by 30% or pause"
  priority: 'high' | 'medium' | 'low';
}

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;  // [View] button callback
  accountId?: string;  // Account ID for deep-links
  dateFrom?: string;   // Date range start (YYYY-MM-DD)
  dateTo?: string;     // Date range end (YYYY-MM-DD)
}

/**
 * RecommendationPanel Component
 *
 * Displays AI-generated recommendations for campaign optimization.
 * Shows up to 3 recommendation cards with campaign, platform, issue, and action.
 * Each card has [View] button (calls onAction) and [Skip] button (calls onDismiss).
 *
 * Displays nothing when recommendations array is empty.
 */
export function RecommendationPanel({
  recommendations,
  onDismiss,
  onAction,
  accountId,
  dateFrom,
  dateTo
}: RecommendationPanelProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Filter out dismissed recommendations and show max 3
  const visibleRecommendations = recommendations
    .filter(r => !dismissed.has(r.id))
    .slice(0, 3);

  if (visibleRecommendations.length === 0) {
    return null;
  }

  // Priority colors
  const priorityStyles = {
    high: {
      badge: 'bg-red-100 text-red-700',
      border: 'border-red-200',
      icon: '🔴',
    },
    medium: {
      badge: 'bg-amber-100 text-amber-700',
      border: 'border-amber-200',
      icon: '🟡',
    },
    low: {
      badge: 'bg-green-100 text-green-700',
      border: 'border-green-200',
      icon: '🟢',
    },
  };

  // Platform display names and colors
  const platformStyles = {
    google: { name: 'Google', color: '#5C6BC0' },
    dv360: { name: 'DV360', color: '#4338CA' },
    meta: { name: 'Meta', color: '#7C3AED' },
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };

  const handleViewAction = (rec: Recommendation) => {
    const deepLink = buildCampaignDeepLink(rec.platform, rec.campaign, {
      accountId,
      dateFrom,
      dateTo,
    });
    router.push(deepLink);
    onAction?.(rec.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">💡</span>
        <h3 className="text-2xl font-bold text-gray-900">What to do today</h3>
      </div>

      {/* Recommendations Container */}
      <div className="space-y-3">
        {visibleRecommendations.map((rec, idx) => {
          const priority = priorityStyles[rec.priority];
          const platform = platformStyles[rec.platform];

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${priority.border}`}
            >
              {/* Card Content */}
              <div className="space-y-3">
                {/* Header: Campaign + Platform Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 truncate">
                        {rec.campaign}
                      </h4>
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                        style={{
                          backgroundColor: `${platform.color}15`,
                          color: platform.color,
                          border: `1px solid ${platform.color}30`,
                        }}
                      >
                        {platform.name}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${priority.badge}`}>
                    {priority.icon} {rec.priority === 'high' ? 'High' : rec.priority === 'medium' ? 'Medium' : 'Low'}
                  </span>
                </div>

                {/* Issue */}
                <div className="flex items-start gap-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Issue: </span>
                    {rec.issue}
                  </p>
                </div>

                {/* Action */}
                <div className="flex items-start gap-2">
                  <p className="text-sm text-gray-900 font-medium">
                    {rec.action}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewAction(rec)}
                    className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    View
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDismiss(rec.id)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Skip
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
