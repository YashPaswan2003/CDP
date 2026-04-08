"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 hover:bg-primary-600 text-white border-primary-500",
  secondary:
    "bg-surface-elevated hover:bg-surface-hover text-text-primary border-border-primary",
  danger: "bg-accent-error hover:bg-red-700 text-white border-accent-error",
  ghost:
    "bg-transparent hover:bg-surface-elevated text-text-primary border-border-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-medium rounded border transition-all duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      {...props}
    />
  );
}
