"use client";

import { AlertCircle } from "lucide-react";

interface UploadBlockedCardProps {
  message?: string;
  accountName?: string;
}

export function UploadBlockedCard({
  message = "Select a client account to upload data.",
  accountName,
}: UploadBlockedCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
            Upload Marketing Data
          </h1>
          <p className="text-slate-400 mt-2">
            Import Excel, XLSX, or CSV files with campaign metrics
          </p>
        </div>

        <div className="p-8 bg-amber-600/10 border border-amber-600/40 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-amber-300">
              Upload not available for agency account
            </h2>
            <p className="text-amber-200">
              {accountName ? (
                <>
                  <strong>{accountName}</strong> is the master agency account.{" "}
                  {message}
                </>
              ) : (
                message
              )}
            </p>
            <p className="text-sm text-amber-300/70">
              Use the account switcher in the sidebar to select a client account
              before uploading data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
