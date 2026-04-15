"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildCampaignDeepLink } from "@/lib/analytics";
import { Lightbulb } from "lucide-react";

export interface Recommendation {
  id: string;
  platform: 'google' | 'meta' | 'dv360';
  campaign: string;
  issue: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  impactEstimate?: string;
  quickAction?: { label: string; type: string };
}

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * RecommendationPanel Component
 *
 * Displays AI-generated recommendations with impact estimates and quick action buttons.
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

  const visibleRecommendations = recommendations
    .filter(r => !dismissed.has(r.id))
    .slice(0, 3);

  if (visibleRecommendations.length === 0) {
    return null;
  }

  const priorityStyles = {
    high: {
      badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      border: 'border-l-red-500',
      bg: 'bg-red-950/10',
      label: 'High',
    },
    medium: {
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      border: 'border-l-amber-500',
      bg: 'bg-amber-950/10',
      label: 'Medium',
    },
    low: {
      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      border: 'border-l-green-500',
      bg: 'bg-green-950/10',
      label: 'Low',
    },
  };

  const platformStyles = {
    google: { name: 'Google', color: '#5C6BC0' },
    dv360: { name: 'DV360', color: '#4338CA' },
    meta: { name: 'Meta', color: '#7C3AED' },
  };

  // Generate quick action if not provided
  const getQuickAction = (rec: Recommendation): { label: string; type: string } => {
    if (rec.quickAction) return rec.quickAction;
    if (rec.issue.toLowerCase().includes('roas') && rec.priority === 'high') {
      return { label: 'Pause Campaign', type: 'pause' };
    }
    if (rec.issue.toLowerCase().includes('budget')) {
      return { label: 'Adjust Budget', type: 'adjust_budget' };
    }
    if (rec.issue.toLowerCase().includes('frequency')) {
      return { label: 'Expand Audience', type: 'expand_audience' };
    }
    return { label: 'Reduce Budget 30%', type: 'reduce_budget' };
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
      view: 'campaign',
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
        <Lightbulb className="w-6 h-6 text-primary-500" />
        <h3 className="text-2xl font-bold text-text-primary">What to do today</h3>
      </div>

      {/* Recommendations Container */}
      <div className="space-y-3">
        {visibleRecommendations.map((rec, idx) => {
          const priority = priorityStyles[rec.priority];
          const platform = platformStyles[rec.platform];
          const quickAction = getQuickAction(rec);

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className={`border-l-4 ${priority.border} ${priority.bg} border border-border-primary rounded-xl p-4 hover:border-border-secondary transition-colors`}
            >
              <div className="space-y-3">
                {/* Header: Campaign + Platform Badge + Priority */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-text-primary truncate">
                        {rec.campaign}
                      </h4>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 border"
                        style={{
                          backgroundColor: `${platform.color}15`,
                          color: platform.color,
                          borderColor: `${platform.color}30`,
                        }}
                      >
                        {platform.name}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 border ${priority.badge}`}>
                    {priority.label}
                  </span>
                </div>

                {/* Issue */}
                <div className="flex items-start gap-2 border-l-2 border-amber-400 pl-3 py-1 bg-amber-500/5 rounded-r">
                  <p className="text-sm">
                    <span className="text-amber-400 font-semibold">Issue: </span>
                    <span className="text-text-secondary">{rec.issue}</span>
                  </p>
                </div>

                {/* Action */}
                <p className="text-sm text-text-primary font-medium">
                  {rec.action}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewAction(rec)}
                    className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    View
                  </motion.button>
                  <span className="inline-flex items-center px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 italic">
                    💡 {quickAction.label}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDismiss(rec.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-text-secondary text-sm font-medium hover:bg-white/10 transition-colors"
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
