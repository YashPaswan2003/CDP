"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestedContent?: Record<string, unknown>;
}

interface SlideChatProps {
  presentationId: string;
  slideIndex: number;
  slideType: string;
  accountId: string;
  onApplyContent?: (content: Record<string, unknown>) => void;
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  executive_summary: [
    "Summarize the key wins this period",
    "What needs immediate attention?",
    "Write a headline for the exec team",
  ],
  platform_overview: [
    "Compare platform efficiency",
    "Which platform should get more budget?",
    "Highlight the best-performing platform",
  ],
  campaign_performance: [
    "Show top 3 campaigns by ROAS",
    "Which campaigns should we pause?",
    "Compare campaign spend vs revenue",
  ],
  keyword_analysis: [
    "Show top 10 keywords by conversions",
    "Find keywords with high spend but low conversions",
    "Suggest negative keywords",
  ],
  funnel_analysis: [
    "Where is the biggest drop-off?",
    "How can we improve mid-funnel conversion?",
    "Compare funnel efficiency across platforms",
  ],
  recommendations: [
    "What should we focus on next month?",
    "Generate 5 action items with expected impact",
    "What quick wins can we implement this week?",
  ],
  custom: [
    "Generate content for this slide",
    "Add key metrics and insights",
    "Write bullet points for presentation",
  ],
};

export default function SlideChat({
  presentationId,
  slideIndex,
  slideType,
  accountId,
  onApplyContent,
}: SlideChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prompts = SUGGESTED_PROMPTS[slideType] || SUGGESTED_PROMPTS.custom;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when slide changes
  useEffect(() => {
    setMessages([]);
  }, [slideIndex]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({ account_id: accountId });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presentations/${presentationId}/slides/${slideIndex}/chat?${params}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: text,
            slide_type: slideType,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.response || "Here is the suggested content.",
          suggestedContent: data.suggested_content,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I could not generate a response. Try editing the slide directly.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. The AI service may be unavailable.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-text-primary">AI Assistant</h3>
        </div>
        <p className="text-xs text-text-tertiary mt-1">
          Ask AI to generate or refine content for this slide
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-text-tertiary mb-3">Suggested prompts:</p>
            {prompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-surface-base border border-border-primary hover:border-primary-500/50 hover:bg-surface-hover text-text-secondary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary-500 text-white"
                  : "bg-surface-base border border-border-primary text-text-primary"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.suggestedContent && onApplyContent && (
                <button
                  onClick={() => onApplyContent(msg.suggestedContent!)}
                  className="mt-2 text-xs px-3 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                >
                  Apply to slide
                </button>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-text-secondary" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary-400" />
            </div>
            <div className="bg-surface-base border border-border-primary rounded-lg px-3 py-2">
              <Loader className="w-4 h-4 text-primary-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border-primary">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about this slide..."
            className="flex-1 px-3 py-2 text-sm bg-surface-base border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary-500"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
