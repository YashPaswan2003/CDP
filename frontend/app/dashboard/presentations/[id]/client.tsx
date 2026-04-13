"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "@/lib/accountContext";
import SlideRenderer, {
  getSlideIcon,
  getSlideLabel,
} from "@/components/presentations/SlideRenderer";
import SlideChat from "@/components/presentations/SlideChat";
import {
  ArrowLeft,
  Download,
  Save,
  Loader,
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";

interface SlideData {
  type: string;
  title: string;
  bullets?: string[];
  metrics?: Array<{ label: string; value: string; change?: string }>;
  table_headers?: string[];
  table_rows?: string[][];
  notes?: string;
}

interface PresentationData {
  id: string;
  title: string;
  template_type: string;
  client_id: string;
  client_name: string;
  date_from: string;
  date_to: string;
  platforms: string[];
  slides: SlideData[];
  status: string;
}

export function PresentationEditorClient() {
  const router = useRouter();
  const params = useParams();
  const presentationId = params.id as string;
  const account = useAccount();
  const accountId = account?.selectedAccount?.id || "";

  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  useEffect(() => {
    if (accountId && presentationId) loadPresentation();
  }, [accountId, presentationId]);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const loadPresentation = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ account_id: accountId });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/${presentationId}?${params}`,
        { headers: getHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setPresentation(data);
        setTitleValue(data.title);
      } else {
        alert("Presentation not found");
        router.push("/dashboard/presentations");
      }
    } catch {
      alert("Failed to load presentation");
      router.push("/dashboard/presentations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!presentation) return;
    setSaving(true);
    try {
      const params = new URLSearchParams({ account_id: accountId });
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/${presentationId}/slides?${params}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ slides: presentation.slides }),
        }
      );
    } catch {
      console.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({ account_id: accountId });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/${presentationId}/download?${params}`,
        { headers }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${presentation?.title || "presentation"}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      console.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const updateSlideTitle = (text: string) => {
    if (!presentation) return;
    const updated = { ...presentation };
    updated.slides = [...updated.slides];
    updated.slides[currentSlide] = { ...updated.slides[currentSlide], title: text };
    setPresentation(updated);
  };

  const updateSlideBullet = (index: number, text: string) => {
    if (!presentation) return;
    const updated = { ...presentation };
    updated.slides = [...updated.slides];
    const slide = { ...updated.slides[currentSlide] };
    const bullets = [...(slide.bullets || [])];
    bullets[index] = text;
    slide.bullets = bullets;
    updated.slides[currentSlide] = slide;
    setPresentation(updated);
  };

  const handleApplyAIContent = (content: Record<string, unknown>) => {
    if (!presentation) return;
    const updated = { ...presentation };
    updated.slides = [...updated.slides];
    const slide = { ...updated.slides[currentSlide] };

    if (content.title) slide.title = content.title as string;
    if (content.bullets) slide.bullets = content.bullets as string[];
    if (content.metrics) slide.metrics = content.metrics as SlideData["metrics"];
    if (content.table_headers) slide.table_headers = content.table_headers as string[];
    if (content.table_rows) slide.table_rows = content.table_rows as string[][];
    if (content.notes) slide.notes = content.notes as string;

    updated.slides[currentSlide] = slide;
    setPresentation(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!presentation) return null;

  const slides = presentation.slides;
  const slide = slides[currentSlide];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-surface-base">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/presentations")}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-5 bg-border-primary" />
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                if (presentation) {
                  setPresentation({ ...presentation, title: titleValue });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingTitle(false);
                  if (presentation) {
                    setPresentation({ ...presentation, title: titleValue });
                  }
                }
              }}
              className="text-lg font-bold text-text-primary bg-transparent border-b border-primary-500 outline-none"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-lg font-bold text-text-primary hover:text-primary-400 transition-colors"
            >
              {presentation.title}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
            title={showChat ? "Hide AI chat" : "Show AI chat"}
          >
            {showChat ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-surface-hover border border-border-primary hover:bg-surface-elevated text-text-primary transition-colors disabled:opacity-50"
          >
            {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download PPTX
          </button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - slide thumbnails */}
        <div className="w-[200px] border-r border-border-primary bg-surface-base overflow-y-auto flex-shrink-0">
          <div className="p-2 space-y-1">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  i === currentSlide
                    ? "bg-primary-500/10 border-2 border-primary-500"
                    : "hover:bg-surface-hover border-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-text-tertiary w-5">
                    {i + 1}
                  </span>
                  <span className={`${i === currentSlide ? "text-primary-400" : "text-text-tertiary"}`}>
                    {getSlideIcon(s.type)}
                  </span>
                </div>
                <p className="text-xs text-text-primary truncate pl-7">
                  {s.title}
                </p>
                <p className="text-[10px] text-text-tertiary pl-7">
                  {getSlideLabel(s.type)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Center panel - slide preview */}
        <div className="flex-1 overflow-y-auto bg-[#0A0A0F]">
          {/* Slide navigation */}
          <div className="flex items-center justify-between px-4 py-2 bg-surface-base/50 border-b border-border-primary/50">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="p-1 rounded hover:bg-surface-hover text-text-secondary disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-text-tertiary">
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <button
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="p-1 rounded hover:bg-surface-hover text-text-secondary disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Slide content area */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto bg-surface-base border border-border-primary rounded-xl shadow-2xl min-h-[480px]">
              <SlideRenderer
                slide={slide}
                isEditing={true}
                onUpdateTitle={updateSlideTitle}
                onUpdateBullet={updateSlideBullet}
              />
            </div>
          </div>

          {/* Presenter notes */}
          {slide.notes && (
            <div className="px-6 pb-6">
              <div className="max-w-4xl mx-auto">
                <p className="text-xs text-text-tertiary mb-1">Presenter Notes</p>
                <p className="text-sm text-text-secondary bg-surface-base border border-border-primary rounded-lg p-3">
                  {slide.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - AI Chat */}
        {showChat && (
          <div className="w-[320px] border-l border-border-primary bg-surface-base flex-shrink-0 flex flex-col">
            <SlideChat
              presentationId={presentationId}
              slideIndex={currentSlide}
              slideType={slide.type}
              accountId={accountId}
              onApplyContent={handleApplyAIContent}
            />
          </div>
        )}
      </div>
    </div>
  );
}
