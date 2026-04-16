"use client";

import { useState } from "react";

interface PeriodSelectorProps {
  periodDays: number;
  onPeriodChange: (days: number) => void;
  showCustom?: boolean;
  customDateFrom?: string;
  customDateTo?: string;
  onCustomDateChange?: (from: string, to: string) => void;
  compareEnabled?: boolean;
  onCompareToggle?: (enabled: boolean) => void;
}

const PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function PeriodSelector({
  periodDays,
  onPeriodChange,
  showCustom = true,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
  compareEnabled = false,
  onCompareToggle,
}: PeriodSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = (days: number) => {
    setIsCustom(false);
    onPeriodChange(days);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period pills */}
      <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePresetClick(preset.days)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              !isCustom && periodDays === preset.days
                ? "bg-primary-500 text-white shadow-sm ring-2 ring-primary-500/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            {preset.label}
          </button>
        ))}
        {showCustom && (
          <button
            onClick={handleCustomClick}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              isCustom
                ? "bg-primary-500 text-white shadow-sm ring-2 ring-primary-500/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            Custom
          </button>
        )}
      </div>

      {/* Custom date inputs */}
      {isCustom && onCustomDateChange && (
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              From
            </label>
            <input
              type="date"
              value={customDateFrom || ""}
              onChange={(e) =>
                onCustomDateChange(e.target.value, customDateTo || "")
              }
              className="px-3 py-1.5 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              To
            </label>
            <input
              type="date"
              value={customDateTo || ""}
              onChange={(e) =>
                onCustomDateChange(customDateFrom || "", e.target.value)
              }
              className="px-3 py-1.5 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none"
            />
          </div>
        </div>
      )}

      {/* Compare toggle */}
      {onCompareToggle && (
        <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={compareEnabled}
              onChange={(e) => onCompareToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-border-strong rounded-full peer-checked:bg-primary-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-xs text-text-secondary whitespace-nowrap">
            Compare to previous period
          </span>
        </label>
      )}
    </div>
  );
}
