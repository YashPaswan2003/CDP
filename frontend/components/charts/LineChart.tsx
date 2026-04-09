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
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3154" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#9CA3AF"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#9CA3AF" }}
        />
        <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} tick={{ fill: "#9CA3AF" }} />
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
            iconType="line"
            formatter={(value) => <span style={{ color: "#9CA3AF" }}>{value}</span>}
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
