'use client';

import { useState } from 'react';
import { ChevronDown, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Action {
  type: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
}

interface FlagBannerProps {
  metric: string;
  current?: number;
  previous?: number;
  entities: string[];
  entity_count: number;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  actions: Action[];
  onAction?: (action: Action) => void;
}

export function FlagBanner({
  metric,
  current,
  previous,
  entities,
  entity_count,
  severity,
  explanation,
  actions,
  onAction,
}: FlagBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const severityStyles = {
    high: 'bg-red-50 border-red-200 hover:bg-red-100',
    medium: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    low: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  };

  const severityBadgeStyles = {
    high: 'bg-red-200 text-red-900',
    medium: 'bg-amber-200 text-amber-900',
    low: 'bg-blue-200 text-blue-900',
  };

  const severityIcons = {
    high: <AlertCircle className="w-5 h-5 text-red-600" />,
    medium: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    low: <Info className="w-5 h-5 text-blue-600" />,
  };

  const actionButtonStyles = {
    high: 'bg-red-600 hover:bg-red-700 text-white',
    medium: 'bg-amber-600 hover:bg-amber-700 text-white',
    low: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <div className={`border rounded-lg p-4 ${severityStyles[severity]} transition-colors cursor-pointer`}>
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          {severityIcons[severity]}
          <div className="flex-1">
            <div className="font-semibold capitalize">
              {metric.replace(/_/g, ' ')}
              {current != null && previous != null && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  {current.toFixed(2)} (was {previous.toFixed(2)})
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{entity_count} item(s) affected</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${severityBadgeStyles[severity]}`}>
            {severity.toUpperCase()}
          </span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-inherit space-y-3">
          {/* Explanation */}
          <div>
            <p className="text-sm text-gray-700">{explanation}</p>
          </div>

          {/* Affected Items */}
          {entities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">AFFECTED ITEMS</p>
              <div className="flex flex-wrap gap-2">
                {entities.slice(0, 5).map((entity) => (
                  <span
                    key={entity}
                    className="px-2 py-1 bg-white rounded text-xs text-gray-700 border border-gray-200"
                  >
                    {entity}
                  </span>
                ))}
                {entities.length > 5 && (
                  <span className="px-2 py-1 text-xs text-gray-600">+{entities.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">RECOMMENDED ACTIONS</p>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => onAction?.(action)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    actionButtonStyles[action.severity]
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
