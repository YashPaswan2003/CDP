"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, AlertCircle, ChevronRight } from "lucide-react";
import { useAccount } from "@/lib/accountContext";
import { UploadBlockedCard } from "@/components/ui/upload-blocked-card";

type UploadStep = "drop" | "mapping" | "confirm" | "success";

interface SheetSummary {
  name: string;
  type: string;
  row_count: number;
  columns: string[];
  column_mapping: Record<string, string | null>;
  unmapped_columns: string[];
  first_rows: any[];
}

export default function UploadPage() {
  const { selectedAccount } = useAccount();
  const [step, setStep] = useState<UploadStep>("drop");
  const selectedAccountId = selectedAccount?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [sheets, setSheets] = useState<Record<string, SheetSummary>>({});
  const [columnMappings, setColumnMappings] = useState<Record<string, Record<string, string>>>({});
  const [activeSheet, setActiveSheet] = useState("");
  const [rowsImported, setRowsImported] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      const validExt = [".xlsx", ".xlsb", ".csv"];
      const ext = droppedFile.name.substring(droppedFile.name.lastIndexOf(".")).toLowerCase();

      if (!validExt.includes(ext)) {
        setError(`Invalid file type. Allowed: ${validExt.join(", ")}`);
        animateShake();
        return;
      }

      setFile(droppedFile);
      await analyzeFile(droppedFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await analyzeFile(selectedFile);
    }
  };

  const analyzeFile = async (fileToAnalyze: File) => {
    setLoading(true);
    setError("");
    setLogLines(["Starting analysis..."]);

    try {
      const formData = new FormData();
      formData.append("file", fileToAnalyze);
      formData.append("account_id", selectedAccountId || "");

      const res = await fetch(`${apiUrl}/api/upload/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const data = await res.json();
      setUploadId(data.upload_id);
      setSheets(data.sheets.summaries || {});
      setActiveSheet(Object.keys(data.sheets.summaries || {})[0] || "");

      // Initialize column mappings
      const mappings: Record<string, Record<string, string | null>> = {};
      for (const [sheetName, summary] of Object.entries(data.sheets.summaries || {})) {
        mappings[sheetName] = (summary as SheetSummary).column_mapping || {};
      }
      setColumnMappings(mappings as Record<string, Record<string, string>>);

      setLogLines([
        "✓ File parsed successfully",
        `✓ Found ${Object.keys(data.sheets.summaries || {}).length} data sheets`,
        `✓ Skipped ${data.sheets.skipped?.length || 0} summary/pivot sheets`,
        "Ready to review column mapping",
      ]);

      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setLogLines((prev) => [...prev, `✗ Error: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  const animateShake = () => {
    // Flash red border + shake (handled via Framer Motion in JSX)
  };

  const handleConfirmUpload = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/api/upload/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_id: uploadId,
          account_id: selectedAccountId,
          sheet_mappings: columnMappings,
        }),
      });

      if (!res.ok) {
        throw new Error("Confirmation failed");
      }

      // Poll status
      pollUploadStatus();
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  const pollUploadStatus = async () => {
    try {
      const maxPolls = 60;
      let pollCount = 0;

      const poll = async () => {
        if (pollCount >= maxPolls) return;

        const res = await fetch(`${apiUrl}/api/upload/status/${uploadId}`);
        const data = await res.json();

        setRowsImported(data.rows_imported || 0);
        setLogLines(
          data.log_lines?.map((line: any) => line.message) || [
            "Processing...",
          ]
        );

        if (data.status === "completed") {
          setStep("success");
        } else if (data.status === "failed") {
          setError("Import failed");
          setStep("drop");
        } else {
          pollCount++;
          setTimeout(poll, 1000);
        }
      };

      poll();
    } catch (err) {
      setError("Status polling failed");
    }
  };

  // Block upload for Ethinos master account
  if (selectedAccount?.id === "ethinos") {
    return (
      <UploadBlockedCard
        accountName={selectedAccount?.name || "Ethinos"}
        message="Select a client account to upload data."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F8FA] via-white to-[#EEF2FF] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
            Upload Marketing Data
          </h1>
          <p className="text-[#6B7280] mt-2">
            Import Excel, XLSX, or CSV files with campaign metrics
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {["drop", "mapping", "confirm", "success"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  ["drop", "mapping", "confirm", "success"].indexOf(
                    step
                  ) >= i
                    ? "bg-blue-600 text-white"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                {i + 1}
              </motion.div>
              {i < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all ${
                    ["drop", "mapping", "confirm", "success"].indexOf(
                      step
                    ) > i
                      ? "bg-blue-600"
                      : "bg-[#E5E7EB]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Drop Zone */}
          {step === "drop" && (
            <motion.div
              key="drop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Drop Zone */}
              <motion.div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                animate={dragActive ? { scale: 1.05 } : {}}
                className={`relative p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                  dragActive
                    ? "border-blue-600 bg-blue-600/10"
                    : "border-[#D1D5DB] bg-white"
                } ${error ? "border-red-600 bg-red-600/5" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".xlsx,.xlsb,.csv"
                  className="hidden"
                />

                {!file ? (
                  <motion.div
                    className="text-center space-y-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Upload className="w-16 h-16 text-[#9CA3AF] mx-auto" />
                    </motion.div>
                    <div>
                      <p className="text-lg font-semibold text-[#1F2937]">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-[#6B7280] mt-1">
                        .xlsx · .xlsb · .csv · up to 200MB
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center gap-3 p-3 bg-green-600/20 border border-green-600/50 rounded-lg inline-block mx-auto"
                    >
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-semibold text-green-300">
                        {file.name}
                      </span>
                    </motion.div>

                    {/* Log Feed */}
                    <div className="max-h-48 overflow-y-auto bg-[#F3F4F6] rounded-lg p-4 text-left space-y-2 border border-[#E5E7EB]">
                      {logLines.map((line, i) => (
                        <motion.p
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-sm text-[#374151] font-mono"
                        >
                          {line.includes("✓") ? (
                            <span className="text-green-400">{line}</span>
                          ) : (
                            line
                          )}
                        </motion.p>
                      ))}
                    </div>

                    {logLines.length > 0 && (
                      <motion.button
                        onClick={() => {
                          setFile(null);
                          setLogLines([]);
                          setSheets({});
                        }}
                        whileHover={{ scale: 1.02 }}
                        className="px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] rounded-lg transition-all text-sm border border-[#D1D5DB]"
                      >
                        Upload another file
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-600/15 border border-red-600/40 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Column Mapping */}
          {step === "mapping" && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Sheet Tabs */}
              <div className="flex gap-2 border-b border-[#E5E7EB] overflow-x-auto">
                {Object.entries(sheets).map(([sheetName, summary]) => (
                  <motion.button
                    key={sheetName}
                    onClick={() => setActiveSheet(sheetName)}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                      activeSheet === sheetName
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-[#6B7280] hover:text-[#374151]"
                    }`}
                  >
                    {sheetName} ({summary.row_count} rows)
                  </motion.button>
                ))}
              </div>

              {/* Column Mapping for Active Sheet */}
              {activeSheet && sheets[activeSheet] && (
                <div className="space-y-6 bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
                      Unmapped Columns
                    </h3>
                    <p className="text-xs text-[#6B7280] mb-4">
                      Select a canonical field for each column
                    </p>

                    {/* Unmapped Columns Section */}
                    {sheets[activeSheet].unmapped_columns.length > 0 ? (
                      <div className="space-y-3">
                        {sheets[activeSheet].unmapped_columns.map((col) => (
                          <div
                            key={col}
                            className="p-3 bg-[#F9FAFB] rounded-lg space-y-2 border border-[#E5E7EB]"
                          >
                            <label className="block text-sm font-semibold text-[#374151]">
                              {col}
                            </label>
                            <select
                              value={
                                columnMappings[activeSheet]?.[col] || ""
                              }
                              onChange={(e) =>
                                setColumnMappings((prev) => ({
                                  ...prev,
                                  [activeSheet]: {
                                    ...prev[activeSheet],
                                    [col]: e.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded text-sm text-[#1F2937] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            >
                              <option value="">Select field...</option>
                              <option value="cost">Cost</option>
                              <option value="clicks">Clicks</option>
                              <option value="impressions">Impressions</option>
                              <option value="ctr">CTR</option>
                              <option value="cpc">CPC</option>
                              <option value="leads">Leads</option>
                              <option value="appointment_booked">
                                Appointment Booked
                              </option>
                              <option value="first_consultation">
                                First Consultation
                              </option>
                              <option value="paid_consultation">
                                Paid Consultation
                              </option>
                              <option value="revenue">Revenue</option>
                              <option value="campaign_name">
                                Campaign Name
                              </option>
                              <option value="adset_name">AdSet Name</option>
                              <option value="platform">Platform</option>
                              <option value="city">City</option>
                              <option value="category">Category</option>
                            </select>
                            <p className="text-xs text-[#9CA3AF] mt-2">
                              Sample:{" "}
                              {sheets[activeSheet].first_rows
                                .slice(0, 1)
                                .map((row) => row[
                                  sheets[activeSheet].columns.indexOf(col)
                                ])
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#6B7280]">
                        All columns auto-mapped! ✓
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setStep("drop")}
                      whileHover={{ scale: 1.02 }}
                      className="px-6 py-3 border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#1F2937] rounded-lg transition-all bg-white"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      onClick={handleConfirmUpload}
                      whileHover={{ scale: 1.02 }}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? "Processing..." : "Confirm & Import"}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Confirm & Status */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 space-y-6 shadow-sm">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-[#1F2937]">
                    Importing Data...
                  </h3>
                  <div className="max-h-64 overflow-y-auto bg-[#F3F4F6] rounded-lg p-4 space-y-2 border border-[#E5E7EB]">
                    {logLines.map((line, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm text-[#374151] font-mono"
                      >
                        {line.includes("✓") ? (
                          <span className="text-green-400">{line}</span>
                        ) : (
                          line
                        )}
                      </motion.p>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">{rowsImported}</span> rows
                      imported
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="p-12 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-600/50 rounded-2xl text-center space-y-4"
              >
                <Check className="w-16 h-16 text-green-400 mx-auto" />
                <div>
                  <h2 className="text-3xl font-bold text-[#1F2937] mb-2">
                    Import Successful!
                  </h2>
                  <p className="text-lg text-green-700">
                    <span className="font-semibold">{rowsImported}</span> rows
                    imported to{" "}
                    <span className="font-semibold">{selectedAccountId}</span>
                  </p>
                </div>

                <div className="pt-6 flex gap-4 justify-center">
                  <motion.button
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                  >
                    View Dashboard
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setStep("drop");
                      setFile(null);
                      setLogLines([]);
                      setSheets({});
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="px-6 py-3 border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#1F2937] font-semibold rounded-lg transition-all bg-white"
                  >
                    Upload Another File
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
