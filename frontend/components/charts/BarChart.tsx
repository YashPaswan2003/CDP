"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: any[];
  dataKeys: { key: string; name: string; color: string }[];
  height?: number;
  showLegend?: boolean;
  xAxisKey?: string;
  layout?: "vertical" | "horizontal";
}

export default function BarChart({
  data,
  dataKeys,
  height = 300,
  showLegend = true,
  xAxisKey = "name",
  layout = "vertical",
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout === "horizontal" ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        {layout === "horizontal" ? (
          <>
            <XAxis
              type="number"
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
              width={95}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#94a3b8" }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #475569",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
          labelStyle={{ color: "#e2e8f0" }}
          formatter={(value: any) => {
            if (typeof value === "number") {
              return value.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              });
            }
            return value;
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span style={{ color: "#cbd5e1" }}>{value}</span>}
          />
        )}
        {dataKeys.map((dk) => (
          <Bar key={dk.key} dataKey={dk.key} fill={dk.color} name={dk.name} radius={[8, 8, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
