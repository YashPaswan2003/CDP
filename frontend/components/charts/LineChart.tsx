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
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#94a3b8"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#94a3b8" }}
        />
        <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#94a3b8" }} />
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
            iconType="line"
            formatter={(value) => <span style={{ color: "#cbd5e1" }}>{value}</span>}
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
