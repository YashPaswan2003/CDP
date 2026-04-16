"use client";

import React from "react";
import {
  diagnose,
  type DiagnosisMetrics,
  type DiagnosisTargets,
  type DiagnosisResult,
} from "@/lib/diagnosis";
import { cn } from "@/lib/utils";

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
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
        severityStyles[result.severity]
      )}
      title={result.explanation}
    >
      {result.icon} {result.label}
    </span>
  );
}
