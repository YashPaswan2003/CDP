"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2 bg-surface-hover border border-border-primary rounded
          text-text-primary placeholder-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 focus:border-primary-500
          transition-all duration-200
          ${error ? "border-accent-error focus:ring-accent-error" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-accent-error">{error}</p>}
      {helperText && <p className="text-xs text-text-tertiary">{helperText}</p>}
    </div>
  );
}
