"use client";

import { useState, useEffect } from "react";
import { Input, Button } from "@/components";
import { AlertCircle, Settings, Bell } from "lucide-react";
import { useAccount } from "@/lib/accountContext";
import { getConfig, setConfig } from "@/lib/api";

export default function SettingsPage() {
  const { selectedAccount } = useAccount();

  const [thresholds, setThresholds] = useState({
    roas_threshold: 3.0,
    cpa_threshold: 50,
    frequency_threshold: 5.0,
    quality_score_threshold: 7,
    currency: "INR",
  });
  const [thresholdLoading, setThresholdLoading] = useState(false);
  const [thresholdSaved, setThresholdSaved] = useState(false);

  useEffect(() => {
    if (!selectedAccount) return;
    setThresholdLoading(true);
    getConfig(selectedAccount.id)
      .then((cfg) => {
        setThresholds({
          roas_threshold: cfg.roas_threshold ?? 3.0,
          cpa_threshold: cfg.cpa_threshold ?? 50,
          frequency_threshold: cfg.frequency_threshold ?? 5.0,
          quality_score_threshold: cfg.quality_score_threshold ?? 7,
          currency: cfg.currency ?? "INR",
        });
      })
      .catch(() => {})
      .finally(() => setThresholdLoading(false));
  }, [selectedAccount]);

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setThresholds((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleThresholdSave = async () => {
    if (!selectedAccount) return;
    setThresholdLoading(true);
    try {
      await setConfig(selectedAccount.id, thresholds);
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setThresholdLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    email: "demo@example.com",
    name: "Marketing Manager",
    notifications: true,
    darkMode: true,
    timezone: "UTC",
  });

  const [originalData] = useState(formData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Settings saved:", formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleCancel = () => {
    setFormData(originalData);
  };

  const handleDeleteAccount = () => {
    alert("Delete account feature coming in Phase 1");
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-secondary">Manage your account and preferences</p>
      </div>

      {/* Account Section */}
      <div className="card space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-bold text-text-primary font-fira-code">
            Account
          </h2>
        </div>

        <Input
          label="Full Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      {/* Preferences Section */}
      <div className="card space-y-6">
        <h2 className="text-xl font-bold text-text-primary font-fira-code">
          Preferences
        </h2>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Timezone
          </label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          >
            <option>UTC</option>
            <option>EST</option>
            <option>CST</option>
            <option>MST</option>
            <option>PST</option>
          </select>
        </div>

        <div className="space-y-3 pt-4 border-t border-border-primary">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-surface-hover transition-colors">
            <input
              type="checkbox"
              name="notifications"
              checked={formData.notifications}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-primary-500"
            />
            <span className="text-text-secondary">Enable email notifications</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-surface-hover transition-colors opacity-50">
            <input
              type="checkbox"
              name="darkMode"
              checked={formData.darkMode}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-primary-500"
              disabled
            />
            <span className="text-text-secondary">Dark mode (always on)</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      {/* Save Toast */}
      {saveToast && (
        <div className="fixed bottom-4 right-4 bg-accent-success text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span>✓</span>
          Settings saved successfully
        </div>
      )}

      {/* Alert Thresholds */}
      <div className="card space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary-500" />
          <div>
            <h2 className="text-xl font-bold text-text-primary font-fira-code">
              Alert Thresholds
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Configure when alerts trigger for this account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              ROAS Target
            </label>
            <input
              type="number"
              name="roas_threshold"
              value={thresholds.roas_threshold}
              onChange={handleThresholdChange}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              CPA Limit ({thresholds.currency})
            </label>
            <input
              type="number"
              name="cpa_threshold"
              value={thresholds.cpa_threshold}
              onChange={handleThresholdChange}
              step="1"
              min="0"
              className="w-full px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Frequency Limit
            </label>
            <input
              type="number"
              name="frequency_threshold"
              value={thresholds.frequency_threshold}
              onChange={handleThresholdChange}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Quality Score Min
            </label>
            <input
              type="number"
              name="quality_score_threshold"
              value={thresholds.quality_score_threshold}
              onChange={handleThresholdChange}
              step="1"
              min="1"
              max="10"
              className="w-full px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Currency
          </label>
          <select
            name="currency"
            value={thresholds.currency}
            onChange={handleThresholdChange}
            className="w-full px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleThresholdSave} disabled={thresholdLoading}>
            {thresholdLoading ? "Saving..." : "Save Thresholds"}
          </Button>
          {thresholdSaved && (
            <span className="text-accent-success text-sm font-medium">
              Thresholds saved successfully
            </span>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border border-accent-error/30 bg-accent-error/5">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-accent-error mt-0.5" />
          <h2 className="text-lg font-bold text-accent-error font-fira-code">
            Danger Zone
          </h2>
        </div>
        <p className="text-text-tertiary text-sm mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-elevated rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-bold text-accent-error">Delete Account</h2>
            <p className="text-text-secondary text-sm">
              This will permanently delete your account and all associated data. Type "DELETE" to confirm.
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 bg-surface-base border border-border-primary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-error"
            />
            <div className="flex gap-2 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDeleteAccount}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
