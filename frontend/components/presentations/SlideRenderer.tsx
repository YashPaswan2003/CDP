"use client";

import {
  BarChart3,
  TrendingUp,
  Search,
  Target,
  Lightbulb,
  Layout,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

interface SlideData {
  type: string;
  title: string;
  bullets?: string[];
  metrics?: Array<{ label: string; value: string; change?: string }>;
  table_headers?: string[];
  table_rows?: string[][];
  notes?: string;
}

interface SlideRendererProps {
  slide: SlideData;
  isEditing?: boolean;
  onUpdateBullet?: (index: number, text: string) => void;
  onUpdateTitle?: (text: string) => void;
}

const SLIDE_ICONS: Record<string, React.ReactNode> = {
  title: <Layout className="w-5 h-5" />,
  executive_summary: <TrendingUp className="w-5 h-5" />,
  platform_overview: <BarChart3 className="w-5 h-5" />,
  campaign_performance: <Target className="w-5 h-5" />,
  keyword_analysis: <Search className="w-5 h-5" />,
  funnel_analysis: <ArrowDownRight className="w-5 h-5" />,
  recommendations: <Lightbulb className="w-5 h-5" />,
  custom: <FileText className="w-5 h-5" />,
};

const TYPE_LABELS: Record<string, string> = {
  title: "Title",
  executive_summary: "Executive Summary",
  platform_overview: "Platform Overview",
  campaign_performance: "Campaign Performance",
  keyword_analysis: "Keyword Analysis",
  funnel_analysis: "Funnel Analysis",
  recommendations: "Recommendations",
  custom: "Custom",
};

export function getSlideIcon(type: string) {
  return SLIDE_ICONS[type] || SLIDE_ICONS.custom;
}

export function getSlideLabel(type: string) {
  return TYPE_LABELS[type] || "Custom";
}

export default function SlideRenderer({
  slide,
  isEditing = false,
  onUpdateBullet,
  onUpdateTitle,
}: SlideRendererProps) {
  const { type, title, bullets, metrics, table_headers, table_rows } = slide;

  // Title slide
  if (type === "title") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdateTitle?.(e.target.value)}
            className="text-3xl font-bold text-text-primary bg-transparent border-b border-primary-500/30 focus:border-primary-500 outline-none text-center w-full max-w-xl pb-2"
          />
        ) : (
          <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
        )}
        <p className="mt-4 text-text-secondary text-lg">Prepared by Ethinos Digital</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Slide header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border-primary">
        <span className="text-primary-500">{getSlideIcon(type)}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary-500/10 text-primary-400">
          {getSlideLabel(type)}
        </span>
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdateTitle?.(e.target.value)}
            className="flex-1 text-xl font-bold text-text-primary bg-transparent border-b border-transparent hover:border-border-primary focus:border-primary-500 outline-none"
          />
        ) : (
          <h2 className="flex-1 text-xl font-bold text-text-primary">{title}</h2>
        )}
      </div>

      {/* Metrics cards */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="bg-surface-base border border-border-primary rounded-lg p-3"
            >
              <p className="text-2xl font-bold text-text-primary">{m.value}</p>
              <p className="text-xs text-text-secondary mt-1">
                {m.label}
                {m.change && (
                  <span
                    className={`ml-2 ${
                      m.change.startsWith("-")
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {m.change.startsWith("-") ? (
                      <ArrowDownRight className="w-3 h-3 inline" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 inline" />
                    )}
                    {m.change}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Data table */}
      {table_headers && table_headers.length > 0 && table_rows && table_rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary">
                {table_headers.map((h, i) => (
                  <th
                    key={i}
                    className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table_rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-border-primary/50 hover:bg-surface-hover transition-colors"
                >
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-3 text-text-primary">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bullet points */}
      {bullets && bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
              {isEditing ? (
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => onUpdateBullet?.(i, e.target.value)}
                  className="flex-1 text-text-primary bg-transparent border-b border-transparent hover:border-border-primary focus:border-primary-500 outline-none py-0.5"
                />
              ) : (
                <span className="text-text-primary">{bullet}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {(!bullets || bullets.length === 0) &&
        (!metrics || metrics.length === 0) &&
        (!table_rows || table_rows.length === 0) && (
          <div className="text-center py-12 text-text-tertiary">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No content yet. Use the AI chat to generate content for this slide.</p>
          </div>
        )}
    </div>
  );
}
