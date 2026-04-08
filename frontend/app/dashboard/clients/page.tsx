"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Users, TrendingUp, DollarSign, Zap, X } from "lucide-react";
import { useAccount } from "@/lib/accountContext";

interface CreateAccountFormData {
  name: string;
  industry: string;
  clientType: "web" | "app";
  platforms: ("google" | "dv360" | "meta")[];
  currency: "INR" | "USD" | "EUR" | "GBP";
}

export default function ClientsPage() {
  const router = useRouter();
  const { refreshAccounts } = useAccount();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<CreateAccountFormData>({
    name: "",
    industry: "",
    clientType: "web",
    platforms: [],
    currency: "INR",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clients = [
    {
      id: "kotak-mf",
      name: "Kotak Mutual Fund",
      campaigns: 8,
      spend: "$15,200.00",
      revenue: "$52,400.00",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Clients</h1>
          <p className="text-text-secondary">Manage and monitor all your client accounts</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Users className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clients.map((client) => (
          <div
            key={client.id}
            className="card group cursor-pointer hover:border-primary-500/50 hover:bg-surface-hover transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 rounded-lg bg-primary-500/10">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <span className="text-text-tertiary text-xs font-medium">ID: {client.id.substring(0, 8)}...</span>
            </div>

            {/* Client Name */}
            <h3 className="text-lg font-bold text-text-primary mb-6 font-fira-code">
              {client.name}
            </h3>

            {/* Metrics */}
            <div className="space-y-4 mb-6 pb-6 border-b border-border-primary">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary-500" />
                <div className="flex-1">
                  <p className="text-text-tertiary text-sm">Active Campaigns</p>
                  <p className="text-text-primary font-semibold">{client.campaigns}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-accent-success" />
                <div className="flex-1">
                  <p className="text-text-tertiary text-sm">Total Spend</p>
                  <p className="text-text-primary font-semibold">{client.spend}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-accent-gold" />
                <div className="flex-1">
                  <p className="text-text-tertiary text-sm">Total Revenue</p>
                  <p className="text-text-primary font-semibold">{client.revenue}</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button variant="primary" className="w-full text-sm" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
              View Details
            </Button>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-elevated rounded-lg p-6 max-w-lg w-full mx-4 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-surface-elevated pb-2">
              <h2 className="text-xl font-bold text-text-primary">Create New Client</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                className="text-text-tertiary hover:text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-600/15 border border-red-600/40 rounded text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., QI Spine Healthcare"
                  className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="E.g., Healthcare, E-commerce, Real Estate"
                  className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Client Type */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Client Type
                </label>
                <select
                  value={formData.clientType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      clientType: e.target.value as "web" | "app",
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="web">Web</option>
                  <option value="app">Mobile App</option>
                </select>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Marketing Platforms
                </label>
                <div className="space-y-2">
                  {["google", "dv360", "meta"].map((platform) => (
                    <label key={platform} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(
                          platform as "google" | "dv360" | "meta"
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              platforms: [
                                ...formData.platforms,
                                platform as "google" | "dv360" | "meta",
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              platforms: formData.platforms.filter((p) => p !== platform),
                            });
                          }
                        }}
                        className="rounded border-border-primary focus:ring-primary-500"
                      />
                      <span className="text-sm text-text-secondary capitalize">
                        {platform === "dv360" ? "Google DV360" : platform}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currency: e.target.value as "INR" | "USD" | "EUR" | "GBP",
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="INR">INR (Indian Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCreateClient}
                disabled={
                  loading ||
                  !formData.name.trim() ||
                  !formData.industry.trim() ||
                  formData.platforms.length === 0
                }
              >
                {loading ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleCreateClient() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          industry: formData.industry,
          client_type: formData.clientType,
          platforms: formData.platforms,
          currency: formData.currency,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create client");
      }

      // Parse response but don't need the data right now
      await response.json();

      // Refresh the accounts list
      await refreshAccounts();

      // Close modal and reset form
      setShowAddModal(false);
      setFormData({
        name: "",
        industry: "",
        clientType: "web",
        platforms: [],
        currency: "INR",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create client account"
      );
    } finally {
      setLoading(false);
    }
  }
}
