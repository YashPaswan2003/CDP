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
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3154" />
        {layout === "horizontal" ? (
          <>
            <XAxis
              type="number"
              stroke="#9CA3AF"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#9CA3AF" }}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              stroke="#9CA3AF"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#9CA3AF" }}
              width={95}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke="#9CA3AF"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#9CA3AF" }}
            />
            <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} tick={{ fill: "#9CA3AF" }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E2034",
            border: "1px solid #2D3154",
            borderRadius: "8px",
            color: "#FFFFFF",
          }}
          labelStyle={{ color: "#FFFFFF" }}
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
            formatter={(value) => <span style={{ color: "#9CA3AF" }}>{value}</span>}
          />
        )}
        {dataKeys.map((dk) => (
          <Bar key={dk.key} dataKey={dk.key} fill={dk.color} name={dk.name} radius={[8, 8, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
