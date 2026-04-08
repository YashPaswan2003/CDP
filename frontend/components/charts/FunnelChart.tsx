"use client";

interface FunnelStage {
  label: string;
  value: number;
  dropOff?: number; // percentage drop from previous stage
}

interface FunnelChartProps {
  stages: FunnelStage[];
  height?: number;
}

export default function FunnelChart({ stages, height = 400 }: FunnelChartProps) {
  const maxValue = Math.max(...stages.map((s) => s.value));

  return (
    <div style={{ height, display: "flex", flexDirection: "column", gap: "8px" }}>
      {stages.map((stage, index) => {
        const widthPercent = (stage.value / maxValue) * 100;
        const dropOffPercent = stage.dropOff || 0;

        return (
          <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", alignItems: "center" }}>
              <div
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: `hsl(${200 - index * 15}, 70%, 50%)`,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "500",
                  minWidth: "200px",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="text-sm">{stage.label}</div>
                <div className="text-lg font-bold">{stage.value.toLocaleString()}</div>
              </div>
              {dropOffPercent > 0 && (
                <div style={{ width: "120px", textAlign: "right" }}>
                  <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: "600" }}>
                    ↓ {dropOffPercent}%
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
