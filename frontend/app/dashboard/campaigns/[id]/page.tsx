import { CampaignDetailClient } from "./client";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function CampaignDetailPage() {
  return <CampaignDetailClient />;
}
