'use client';

import { useState } from 'react';
import { setConfig } from '@/lib/api';
import { X } from 'lucide-react';

interface ConfigSetupModalProps {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type SetupStep = 'upload' | 'review' | 'confirm' | 'done';

export function ConfigSetupModal({ accountId, isOpen, onClose, onComplete }: ConfigSetupModalProps) {
  const [step, setStep] = useState<SetupStep>('upload');
  const [loading, setLoading] = useState(false);
  const [config, setConfigState] = useState({
    roas_threshold: 3.0,
    cpa_threshold: 50,
    spend_pace_pct: 100,
    ctr_threshold: 0.02,
    cvr_threshold: 0.02,
    quality_score_threshold: 7,
    frequency_threshold: 5.0,
    currency: 'INR',
  });

  const handleNext = async () => {
    if (step === 'upload') {
      setStep('review');
    } else if (step === 'review') {
      setStep('confirm');
    } else if (step === 'confirm') {
      setLoading(true);
      try {
        await setConfig(accountId, config);
        setStep('done');
        setTimeout(() => {
          onComplete();
          onClose();
        }, 2000);
      } catch (err) {
        console.error('Error saving config:', err);
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Account Setup</h2>
            <p className="text-sm text-gray-500 mt-1">
              Step {step === 'upload' ? 1 : step === 'review' ? 2 : step === 'confirm' ? 3 : 4} of 4
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Campaign Data</h3>
              <p className="text-gray-600">
                Import your marketing data from CSV, Google Ads, DV360, or Meta APIs.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center">
                  <div className="text-2xl mb-2">📄</div>
                  <p className="font-medium text-gray-900">CSV Upload</p>
                  <p className="text-xs text-gray-500 mt-1">Direct CSV import</p>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center">
                  <div className="text-2xl mb-2">🔗</div>
                  <p className="font-medium text-gray-900">API Connection</p>
                  <p className="text-xs text-gray-500 mt-1">Google Ads, DV360, Meta</p>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                For MVP testing, CSV works great. You can connect APIs later.
              </p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Data Mapping</h3>
              <p className="text-gray-600">
                We auto-detected these field mappings from your upload. Confirm they look right:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Impressions Field</span>
                  <span className="font-medium">impressions ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Clicks Field</span>
                  <span className="font-medium">clicks ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Spend Field</span>
                  <span className="font-medium">spend / cost ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Conversion Field</span>
                  <span className="font-medium">conversions ✓</span>
                </div>
              </div>
              <p className="text-sm text-blue-600">
                💡 Found 3 custom metrics: "revenue", "funnel_stage", "category"
              </p>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Set Performance Thresholds</h3>
              <p className="text-gray-600">
                These thresholds determine when campaigns get flagged for issues:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ROAS Target
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.roas_threshold}
                    onChange={(e) => setConfigState({ ...config, roas_threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPA Limit ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={config.cpa_threshold}
                    onChange={(e) => setConfigState({ ...config, cpa_threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CTR Min (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.ctr_threshold}
                    onChange={(e) => setConfigState({ ...config, ctr_threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency Limit (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.frequency_threshold}
                    onChange={(e) => setConfigState({ ...config, frequency_threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Setup Complete!</h3>
              <p className="text-gray-600">
                Your account is ready. Redirecting to Monitor dashboard...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={loading || step === 'done'}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'done' ? 'Redirecting...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
