"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Users, TrendingUp, DollarSign, Zap, X } from "lucide-react";
import { useAccount } from "@/lib/accountContext";

export default function ClientsPage() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  const clients = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "TechStore E-commerce",
      campaigns: 5,
      spend: "$12,450.00",
      revenue: "$45,200.00",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "RealEstate Luxury",
      campaigns: 4,
      spend: "$8,900.00",
      revenue: "$32,100.00",
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
          <div className="bg-surface-elevated rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Add New Client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-tertiary hover:text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="E.g., Acme Corp"
                className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  if (newClientName.trim()) {
                    alert(`Client "${newClientName}" would be created (feature in Phase 1)`);
                    setShowAddModal(false);
                    setNewClientName("");
                  }
                }}
              >
                Add Client
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
