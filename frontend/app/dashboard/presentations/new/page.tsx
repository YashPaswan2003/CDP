"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { useAccount } from "@/lib/accountContext";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Zap,
  ArrowLeft,
  ArrowRight,
  Loader,
  Upload,
  Check,
} from "lucide-react";

interface TemplateOption {
  id: string;
  title: string;
  description: string;
  slideCount: number;
  icon: React.ReactNode;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "monthly_performance",
    title: "Monthly Performance Report",
    description: "Comprehensive monthly report covering all platforms, campaigns, keywords, and funnel analysis with strategic recommendations.",
    slideCount: 8,
    icon: <BarChart3 className="w-8 h-8" />,
  },
  {
    id: "campaign_deep_dive",
    title: "Campaign Deep Dive",
    description: "Focused analysis of campaign performance, keyword data, and funnel metrics with an optimization plan.",
    slideCount: 6,
    icon: <TrendingUp className="w-8 h-8" />,
  },
  {
    id: "client_qbr",
    title: "Client QBR",
    description: "Quarterly business review with per-platform breakdowns, competitive landscape, budget allocation, and strategic goals.",
    slideCount: 13,
    icon: <Calendar className="w-8 h-8" />,
  },
  {
    id: "weekly_pulse",
    title: "Weekly Pulse",
    description: "Quick weekly snapshot with highlights, campaign performance, and action items.",
    slideCount: 4,
    icon: <Zap className="w-8 h-8" />,
  },
];

interface AccountOption {
  id: string;
  name: string;
}

export default function NewPresentationPage() {
  const router = useRouter();
  const account = useAccount();
  const accountId = account?.selectedAccount?.id || "";

  const [step, setStep] = useState<"template" | "configure">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-31");
  const [platforms, setPlatforms] = useState<string[]>(["google", "dv360", "meta"]);
  const [generating, setGenerating] = useState(false);
  const [clients, setClients] = useState<AccountOption[]>([]);

  // Load available clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          const accts = (data.accounts || []).map((a: { id: string; name: string }) => ({
            id: a.id,
            name: a.name,
          }));
          setClients(accts);
          if (accts.length > 0) setClientId(accts[0].id);
        }
      } catch {
        // Fallback: use accounts from context
        if (account?.accessibleAccounts) {
          const accts = account.accessibleAccounts.map((a) => ({
            id: a.id,
            name: a.name,
          }));
          setClients(accts);
          if (accts.length > 0) setClientId(accts[0].id);
        }
      }
    };
    loadClients();
  }, [account?.accessibleAccounts]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !clientId) return;
    setGenerating(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({ account_id: accountId });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/generate?${params}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            template_type: selectedTemplate,
            client_id: clientId,
            date_from: dateFrom,
            date_to: dateTo,
            platforms,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/presentations/${data.id}`);
      } else {
        alert("Failed to generate presentation. Check backend connection.");
      }
    } catch (err) {
      console.error("Generate error:", err);
      alert("Error generating presentation. Is the backend running?");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            step === "configure" ? setStep("template") : router.push("/dashboard/presentations")
          }
          className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">New Presentation</h1>
          <p className="text-text-secondary">
            {step === "template" ? "Step 1: Choose a template" : "Step 2: Configure your report"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          step === "template" ? "bg-primary-500 text-white" : "bg-primary-500/20 text-primary-400"
        }`}>
          {step === "configure" ? <Check className="w-4 h-4" /> : <span>1</span>}
          <span>Template</span>
        </div>
        <div className="w-8 h-px bg-border-primary" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          step === "configure" ? "bg-primary-500 text-white" : "bg-surface-base text-text-tertiary border border-border-primary"
        }`}>
          <span>2</span>
          <span>Configure</span>
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {step === "template" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl.id);
                  setStep("configure");
                }}
                className={`text-left p-6 rounded-xl border-2 transition-all hover:border-primary-500/50 hover:bg-surface-hover ${
                  selectedTemplate === tmpl.id
                    ? "border-primary-500 bg-primary-500/5"
                    : "border-border-primary bg-surface-base"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500">
                    {tmpl.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary mb-1">
                      {tmpl.title}
                    </h3>
                    <p className="text-sm text-text-secondary mb-3">
                      {tmpl.description}
                    </p>
                    <span className="text-xs px-2 py-1 rounded bg-surface-elevated text-text-tertiary border border-border-primary">
                      {tmpl.slideCount} slides
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Upload custom template */}
          <div className="p-6 rounded-xl border-2 border-dashed border-border-primary bg-surface-base text-center">
            <Upload className="w-8 h-8 mx-auto mb-3 text-text-tertiary" />
            <p className="text-sm text-text-secondary mb-1">
              Upload Custom Template
            </p>
            <p className="text-xs text-text-tertiary">
              Drag and drop a .pptx file here (coming soon)
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === "configure" && (
        <div className="space-y-6">
          {/* Selected template badge */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
            <Check className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-text-primary font-medium">
              Template: {TEMPLATES.find((t) => t.id === selectedTemplate)?.title}
            </span>
            <button
              onClick={() => setStep("template")}
              className="ml-auto text-xs text-primary-400 hover:text-primary-300"
            >
              Change
            </button>
          </div>

          {/* Client selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-primary-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Platform selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Platforms to Include
            </label>
            <div className="flex gap-3">
              {[
                { id: "google", label: "Google Ads" },
                { id: "dv360", label: "DV360" },
                { id: "meta", label: "Meta" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    platforms.includes(p.id)
                      ? "bg-primary-500/10 border-primary-500 text-primary-400"
                      : "bg-surface-base border-border-primary text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {platforms.includes(p.id) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              className="flex items-center gap-2 px-6 py-3"
              onClick={handleGenerate}
              disabled={generating || !clientId || platforms.length === 0}
            >
              {generating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Generate Presentation
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
