"use client";

import React from "react";
import {
  diagnose,
  type DiagnosisMetrics,
  type DiagnosisTargets,
  type DiagnosisResult,
} from "@/lib/diagnosis";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, TrendingUp, Zap } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "check-circle": CheckCircle,
  "trending-up": TrendingUp,
  "zap": Zap,
};

export interface DiagnosisTagProps {
  metrics: DiagnosisMetrics;
  targets?: DiagnosisTargets;
}

const severityStyles: Record<DiagnosisResult["severity"], string> = {
  critical: "bg-red-500/15 text-red-400",
  warning: "bg-amber-500/15 text-amber-400",
  opportunity: "bg-green-500/15 text-green-400",
};

export function DiagnosisTag({ metrics, targets }: DiagnosisTagProps) {
  const result = diagnose(metrics, targets);

  if (!result) return <></>;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-default",
        severityStyles[result.severity]
      )}
      title={result.explanation}
    >
      {ICON_MAP[result.icon] ? React.createElement(ICON_MAP[result.icon], { className: "w-3 h-3" }) : null}
      {result.label}
    </span>
  );
}
