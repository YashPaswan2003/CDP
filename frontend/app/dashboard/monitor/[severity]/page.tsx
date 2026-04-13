import { MonitorDrilldownClient } from "./client";

export function generateStaticParams() {
  return [
    { severity: "critical" },
    { severity: "warning" },
    { severity: "healthy" },
  ];
}

export default function MonitorDrilldownPage() {
  return <MonitorDrilldownClient />;
}
