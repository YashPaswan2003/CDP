"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";

/* ── ColumnFilter (inline in table header) ── */

interface ColumnFilterProps {
  columnName: string;
  onFilterChange: (filter: { min?: number; max?: number } | null) => void;
  currentFilter?: { min?: number; max?: number } | null;
}

export function ColumnFilter({
  columnName,
  onFilterChange,
  currentFilter,
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState<string>(
    currentFilter?.min != null ? String(currentFilter.min) : ""
  );
  const [max, setMax] = useState<string>(
    currentFilter?.max != null ? String(currentFilter.max) : ""
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Sync local state when currentFilter changes externally
  useEffect(() => {
    setMin(currentFilter?.min != null ? String(currentFilter.min) : "");
    setMax(currentFilter?.max != null ? String(currentFilter.max) : "");
  }, [currentFilter]);

  const handleApply = () => {
    const minVal = min !== "" ? Number(min) : undefined;
    const maxVal = max !== "" ? Number(max) : undefined;
    if (minVal == null && maxVal == null) {
      onFilterChange(null);
    } else {
      onFilterChange({ min: minVal, max: maxVal });
    }
    setOpen(false);
  };

  const handleClear = () => {
    setMin("");
    setMax("");
    onFilterChange(null);
    setOpen(false);
  };

  const isActive = currentFilter != null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`p-0.5 rounded transition-colors ${
          isActive
            ? "text-indigo-400 hover:text-indigo-300"
            : "text-gray-500 hover:text-gray-300"
        }`}
        title={`Filter ${columnName}`}
      >
        <Filter className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 min-w-[180px]">
          <p className="text-xs text-gray-400 mb-2 font-medium">
            Filter: {columnName}
          </p>
          <div className="flex flex-col gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Min</label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Max</label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="--"
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-500 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="flex-1 px-2 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── QuickFilters (above table) ── */

interface QuickFiltersProps {
  onQuickFilter: (type: "underperformers" | "top" | "clear") => void;
  activeFilter?: string | null;
  activeColumnFilters?: Record<string, { min?: number; max?: number }>;
  onClearColumnFilter?: (column: string) => void;
}

export function QuickFilters({
  onQuickFilter,
  activeFilter,
  activeColumnFilters,
  onClearColumnFilter,
}: QuickFiltersProps) {
  const columnFilterEntries = activeColumnFilters
    ? Object.entries(activeColumnFilters)
    : [];

  function formatFilterLabel(
    column: string,
    filter: { min?: number; max?: number }
  ): string {
    const parts: string[] = [];
    if (filter.min != null) parts.push(`\u2265 ${filter.min}`);
    if (filter.max != null) parts.push(`\u2264 ${filter.max}`);
    return `${column} ${parts.join(" & ")}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onQuickFilter("underperformers")}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          activeFilter === "underperformers"
            ? "bg-red-600/20 text-red-400 border border-red-500/40"
            : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200 hover:border-gray-600"
        }`}
      >
        <span className="mr-1">{"\uD83D\uDD34"}</span> Underperformers
      </button>
      <button
        onClick={() => onQuickFilter("top")}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          activeFilter === "top"
            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
            : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200 hover:border-gray-600"
        }`}
      >
        <span className="mr-1">{"\uD83D\uDFE2"}</span> Top Performers
      </button>
      <button
        onClick={() => onQuickFilter("clear")}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200 hover:border-gray-600 transition-colors"
      >
        Clear
      </button>

      {/* Active column filter pills */}
      {columnFilterEntries.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          {columnFilterEntries.map(([column, filter]) => (
            <span
              key={column}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
            >
              {formatFilterLabel(column, filter)}
              {onClearColumnFilter && (
                <button
                  onClick={() => onClearColumnFilter(column)}
                  className="p-0.5 rounded-full hover:bg-indigo-500/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </>
      )}
    </div>
  );
}
