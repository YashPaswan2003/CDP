"use client";

import { useState, useRef } from "react";
import { uploadAPI } from "@/lib/api";
import { Input, Button } from "@/components";
import { Upload, AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface UploadResult {
  filename: string;
  rows_imported: number;
  status: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState("google_ads");
  const [clientId, setClientId] = useState("550e8400-e29b-41d4-a716-446655440000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      setError("");
      setResult(null);
    } else {
      setError("Please select a valid CSV file");
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await uploadAPI.uploadCSV(file, clientId, platform);
      setResult(response.data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">CSV Upload</h1>
        <p className="text-text-secondary">Import campaign metrics from your advertising platforms</p>
      </div>

      {/* Upload Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client ID */}
          <Input
            label="Client ID"
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled
            helperText="Pre-filled for your account"
          />

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            >
              <option value="google_ads">Google Ads</option>
              <option value="dv360">DV360</option>
              <option value="meta">Meta</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              CSV File
            </label>
            <div
              className="border-2 border-dashed border-border-primary rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div>
                  <Upload className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                  <p className="text-text-primary font-medium">{file.name}</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-text-secondary font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-text-tertiary mt-1">CSV files only</p>
                </div>
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Required columns: date, campaign_id, campaign_name, platform, impressions, clicks, spend, conversions, revenue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-accent-error/10 border border-accent-error/30 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-error flex-shrink-0 mt-0.5" />
              <p className="text-accent-error text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!file || loading}
            variant="primary"
            className="w-full"
          >
            {loading ? "Uploading..." : "Upload CSV"}
          </Button>
        </form>
      </div>

      {/* Success Message */}
      {result && (
        <div className="card border border-accent-success/30 bg-accent-success/10">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-accent-success font-medium mb-2">Upload Successful</p>
              <div className="space-y-1 text-sm text-accent-success/80">
                <p>File: {result.filename}</p>
                <p>Rows imported: {result.rows_imported}</p>
                <p>Status: {result.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Format Guide */}
      <div className="card border border-border-primary bg-surface-base">
        <div className="flex items-start gap-3 mb-4">
          <FileText className="w-5 h-5 text-text-secondary flex-shrink-0 mt-0.5" />
          <h3 className="font-bold text-text-primary font-fira-code">CSV Format</h3>
        </div>
        <div className="text-sm text-text-secondary space-y-2">
          <p>Your CSV file should include these columns in any order:</p>
          <ul className="list-disc list-inside space-y-1 mt-3">
            <li>date (YYYY-MM-DD format)</li>
            <li>campaign_id (UUID)</li>
            <li>campaign_name (text)</li>
            <li>platform (google_ads, dv360, meta)</li>
            <li>impressions (number)</li>
            <li>clicks (number)</li>
            <li>spend (decimal)</li>
            <li>conversions (number)</li>
            <li>revenue (decimal)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
