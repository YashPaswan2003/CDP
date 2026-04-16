"use client";

interface DateRangeValue {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  label?: string;
}

export function DateRangePicker({ value, onChange, label = "Date Range" }: DateRangePickerProps) {
  const today = new Date().toISOString().split("T")[0];

  const getPresetRange = (preset: string): DateRangeValue => {
    const now = new Date();
    switch (preset) {
      case "7D":
        return { start: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0], end: today };
      case "30D":
        return { start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0], end: today };
      case "90D":
        return { start: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0], end: today };
      case "MTD":
        return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], end: today };
      case "Last Mo": {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: d.toISOString().split("T")[0],
          end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0],
        };
      }
      default:
        return { start: today, end: today };
    }
  };

  const PRESETS = ["7D", "30D", "90D", "MTD", "Last Mo"];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-secondary">{label}</label>

      {/* Preset buttons */}
      <div className="flex gap-1 flex-wrap mb-3">
        {PRESETS.map((preset) => {
          const range = getPresetRange(preset);
          const isActive = value.start === range.start && value.end === range.end;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(range)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Date inputs */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-text-secondary mb-2">From</label>
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="w-full px-3 py-2 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-text-secondary mb-2">To</label>
          <input
            type="date"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="w-full px-3 py-2 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
          />
        </div>
      </div>
    </div>
  );
}
