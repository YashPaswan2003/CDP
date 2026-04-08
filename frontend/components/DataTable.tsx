"use client";

import React from "react";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  striped?: boolean;
  onRowClick?: (row: Record<string, any>) => void;
}

const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export default function DataTable({
  columns,
  data,
  striped = true,
  onRowClick,
}: DataTableProps) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-primary-500 text-white border-b border-primary-600">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-semibold text-sm ${
                    alignmentClasses[col.align || "left"]
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-border-primary hover:bg-surface-hover transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                } ${striped && rowIdx % 2 === 1 ? "bg-surface-base" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={`${rowIdx}-${col.key}`}
                    className={`py-3 px-4 text-text-primary text-sm ${
                      alignmentClasses[col.align || "left"]
                    }`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
