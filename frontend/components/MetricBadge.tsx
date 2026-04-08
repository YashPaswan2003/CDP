"use client";

type BadgeType = "success" | "warning" | "error" | "info" | "neutral";

interface MetricBadgeProps {
  label: string;
  type: BadgeType;
  size?: "sm" | "md";
}

const typeColors: Record<BadgeType, { bg: string; text: string }> = {
  success: { bg: "bg-accent-success/20", text: "text-accent-success" },
  warning: { bg: "bg-accent-warning/20", text: "text-accent-warning" },
  error: { bg: "bg-accent-error/20", text: "text-accent-error" },
  info: { bg: "bg-accent-info/20", text: "text-accent-info" },
  neutral: { bg: "bg-border-primary/50", text: "text-text-secondary" },
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

export default function MetricBadge({
  label,
  type,
  size = "md",
}: MetricBadgeProps) {
  const colors = typeColors[type];

  return (
    <span
      className={`inline-block ${colors.bg} ${colors.text} font-medium rounded border border-current border-opacity-20 ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
}
