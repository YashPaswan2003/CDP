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
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        {layout === "horizontal" ? (
          <>
            <XAxis
              type="number"
              stroke="#D1D5DB"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#6B7280" }}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              stroke="#D1D5DB"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#6B7280" }}
              width={95}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke="#D1D5DB"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#6B7280" }}
            />
            <YAxis stroke="#D1D5DB" style={{ fontSize: "12px" }} tick={{ fill: "#6B7280" }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            color: "#111827",
          }}
          labelStyle={{ color: "#111827" }}
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
            formatter={(value) => <span style={{ color: "#6B7280" }}>{value}</span>}
          />
        )}
        {dataKeys.map((dk) => (
          <Bar key={dk.key} dataKey={dk.key} fill={dk.color} name={dk.name} radius={[8, 8, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
