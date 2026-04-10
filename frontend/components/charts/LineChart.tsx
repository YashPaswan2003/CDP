"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineChartProps {
  data: any[];
  dataKeys: { key: string; name: string; color: string }[];
  height?: number;
  showLegend?: boolean;
  xAxisKey?: string;
}

export default function LineChart({
  data,
  dataKeys,
  height = 300,
  showLegend = true,
  xAxisKey = "date",
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#D1D5DB"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#6B7280" }}
        />
        <YAxis stroke="#D1D5DB" style={{ fontSize: "12px" }} tick={{ fill: "#6B7280" }} />
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
            iconType="line"
            formatter={(value) => <span style={{ color: "#6B7280" }}>{value}</span>}
          />
        )}
        {dataKeys.map((dk) => (
          <Line
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            stroke={dk.color}
            name={dk.name}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
