/**
 * Campaign diagnosis engine — returns the highest-priority issue
 * detected from a set of campaign metrics and optional targets.
 */

export interface DiagnosisMetrics {
  cpc: number;
  ctr: number;
  cvr: number;
  roas: number;
  spend: number;
  budget?: number;
  pacing?: number; // pacing % (e.g. 110 means 110%)
}

export interface DiagnosisTargets {
  cpcTarget?: number;
  ctrTarget?: number;
  cvrTarget?: number;
  roasTarget?: number;
}

export interface DiagnosisResult {
  severity: "critical" | "warning" | "opportunity";
  label: string;
  explanation: string;
  icon: string;
}

const DEFAULT_TARGETS: Required<DiagnosisTargets> = {
  roasTarget: 3,
  ctrTarget: 0.05,
  cvrTarget: 0.01,
  cpcTarget: 25,
};

export function diagnose(
  metrics: DiagnosisMetrics,
  targets?: DiagnosisTargets
): DiagnosisResult | null {
  const t = { ...DEFAULT_TARGETS, ...targets };

  // 1. ROAS < 1.0
  if (metrics.roas < 1.0) {
    return {
      severity: "critical",
      label: "Negative ROI",
      explanation: "Spending more than earning",
      icon: "\uD83D\uDD34",
    };
  }

  // 2. High CPC (>150% target) + Low CVR (<50% target)
  if (metrics.cpc > t.cpcTarget * 1.5 && metrics.cvr < t.cvrTarget * 0.5) {
    return {
      severity: "critical",
      label: "Traffic quality issue",
      explanation: "High cost clicks not converting",
      icon: "\uD83D\uDD34",
    };
  }

  // 3. High CTR (>2x target) + Low CVR (<50% target)
  if (metrics.ctr > t.ctrTarget * 2 && metrics.cvr < t.cvrTarget * 0.5) {
    return {
      severity: "warning",
      label: "Landing page issue",
      explanation:
        "Good ad engagement but poor conversion \u2014 check landing page",
      icon: "\uD83D\uDFE1",
    };
  }

  // 4. High Spend (>budget) + Low ROAS (<target)
  if (
    metrics.budget &&
    metrics.spend > metrics.budget &&
    metrics.roas < t.roasTarget
  ) {
    return {
      severity: "critical",
      label: "Budget bleed",
      explanation: "Overspending with poor returns",
      icon: "\uD83D\uDD34",
    };
  }

  // 5. Low CTR (<50% target) + High CPC (>target)
  if (metrics.ctr < t.ctrTarget * 0.5 && metrics.cpc > t.cpcTarget) {
    return {
      severity: "warning",
      label: "Ad relevance issue",
      explanation: "Low engagement driving up costs",
      icon: "\uD83D\uDFE1",
    };
  }

  // 6. Pacing >120%
  if (metrics.pacing !== undefined && metrics.pacing > 120) {
    return {
      severity: "critical",
      label: "Overpacing",
      explanation: "On track to exceed budget significantly",
      icon: "\uD83D\uDD34",
    };
  }

  // 7. Pacing <60%
  if (metrics.pacing !== undefined && metrics.pacing < 60) {
    return {
      severity: "warning",
      label: "Underpacing",
      explanation: "Significantly under-delivering",
      icon: "\uD83D\uDFE1",
    };
  }

  // 8. ROAS >5x + Spend <30% of budget
  if (
    metrics.roas > t.roasTarget * 5 &&
    metrics.budget &&
    metrics.spend < metrics.budget * 0.3
  ) {
    return {
      severity: "opportunity",
      label: "Scale opportunity",
      explanation: "Strong returns with room to increase spend",
      icon: "\uD83D\uDFE2",
    };
  }

  // 9. All healthy
  return null;
}
