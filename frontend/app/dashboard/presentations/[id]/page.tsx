import { PresentationEditorClient } from "./client";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function PresentationEditorPage() {
  return <PresentationEditorClient />;
}
