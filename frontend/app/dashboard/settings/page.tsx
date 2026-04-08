"use client";

import { useState } from "react";
import { Input, Button } from "@/components";
import { AlertCircle, Settings } from "lucide-react";

export default function SettingsPage() {
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
