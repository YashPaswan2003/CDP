"use client";

import React from "react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant?: "light" | "bordered";
}

export default function ChartContainer({
  title,
  children,
  action,
  variant = "bordered",
}: ChartContainerProps) {
  return (
    <div
      className={`${
        variant === "bordered" ? "card" : "bg-surface-elevated rounded-lg p-6"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-primary font-fira-code">
          {title}
        </h3>
        {action}
      </div>
      <div className="text-text-secondary">
        {children}
      </div>
    </div>
  );
}
