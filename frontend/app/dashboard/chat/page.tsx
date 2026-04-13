"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { chatAPI } from "@/lib/api";
import { useAccount } from "@/lib/accountContext";
import { MessageSquare, Send, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

const SUGGESTED_PROMPTS = [
  { label: "Overall ROAS", text: "What's our overall ROAS this month?" },
  { label: "Pause campaigns", text: "Which campaigns should we pause?" },
  { label: "Google vs Meta", text: "Compare Google vs Meta performance" },
  { label: "Top keywords", text: "What are the top performing keywords?" },
  { label: "ROAS analysis", text: "Analyze the ROAS drop in March" },
];

function getStorageKey(accountId: string) {
  return `ethinos_chat_${accountId}`;
}

function loadMessages(accountId: string): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(getStorageKey(accountId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Corrupted storage, ignore
  }
  return [];
}

function saveMessages(accountId: string, messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(accountId), JSON.stringify(messages));
  } catch {
    // Storage full, ignore
  }
}

export default function ChatPage() {
  const { selectedAccount } = useAccount();
  const searchParams = useSearchParams();
  const accountId = selectedAccount?.id || "";
  const accountName = selectedAccount?.name || "Unknown";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages from localStorage when account changes
  useEffect(() => {
    if (!accountId) return;
    const stored = loadMessages(accountId);
    setMessages(stored);
    setInitialized(true);
  }, [accountId]);

  // Save messages to localStorage whenever they change (after init)
  useEffect(() => {
    if (!accountId || !initialized) return;
    saveMessages(accountId, messages);
  }, [messages, accountId, initialized]);

  // Handle deep-link context from query params (e.g., from alert "Ask AI" button)
  useEffect(() => {
    const contextCampaign = searchParams.get("campaign");
    const contextMetric = searchParams.get("metric");
    const contextPlatform = searchParams.get("platform");
    if (contextCampaign && initialized && messages.length === 0) {
      const parts = [`Analyze the "${contextCampaign}" campaign`];
      if (contextPlatform) parts.push(`on ${contextPlatform}`);
      if (contextMetric) parts.push(`focusing on ${contextMetric}`);
      setInput(parts.join(" "));
      inputRef.current?.focus();
    }
  }, [searchParams, initialized, messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setError(null);
    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(accountId, updatedMessages);
      const assistantMessage: Message = {
        role: "assistant",
        content: response.message || "No response received.",
        timestamp: Date.now(),
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (err: any) {
      const errorMsg =
        err?.message || "Failed to get a response. Please try again.";
      setError(errorMsg);
      // Remove the user message if the request failed entirely (optional: keep it)
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handlePromptClick = (promptText: string) => {
    handleSend(promptText);
  };

  const clearHistory = () => {
    setMessages([]);
    setError(null);
    if (accountId) {
      localStorage.removeItem(getStorageKey(accountId));
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary-400" />
            Chat Assistant
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Ask Gemma about {accountName}&apos;s marketing performance and insights
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary hover:text-red-400 rounded-lg hover:bg-surface-hover transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-surface-elevated rounded-lg border border-border-primary p-4 overflow-y-auto space-y-4">
        {/* Empty State with Suggested Prompts */}
        {messages.length === 0 && !loading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-lg">
              <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-xl font-bold text-text-secondary mb-2">
                Ask anything about {accountName}
              </p>
              <p className="text-sm text-text-tertiary mb-6">
                Campaign performance, ROI, spend analysis, optimization suggestions, and more
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <motion.button
                    key={prompt.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePromptClick(prompt.text)}
                    className="px-3 py-2 text-sm rounded-lg bg-surface-base border border-border-primary text-text-secondary hover:text-primary-400 hover:border-primary-500 transition-colors"
                  >
                    {prompt.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={`${idx}-${msg.timestamp || idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary-500 text-white rounded-br-none"
                    : "bg-surface-base text-text-primary rounded-bl-none border border-border-primary"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-surface-base px-4 py-3 rounded-lg border border-border-primary rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
                <span className="text-xs text-text-tertiary ml-1">Gemma is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-300 hover:text-red-200 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={`Ask about ${accountName}'s campaigns...`}
          className="flex-1 px-4 py-3 bg-surface-hover border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}
