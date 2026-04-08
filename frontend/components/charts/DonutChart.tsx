"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  data: { name: string; value: number }[];
  colors: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export default function DonutChart({
  data,
  colors,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
          animationDuration={800}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
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
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          formatter={(value) => <span style={{ color: "#cbd5e1" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
