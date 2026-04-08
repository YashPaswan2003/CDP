"use client";

import { useState, useRef, useEffect } from "react";
import { chatAPI } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientId] = useState("550e8400-e29b-41d4-a716-446655440000");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(clientId, updatedMessages);
      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.message,
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-120px)]">
      <div>
        <h1 className="text-4xl font-bold text-text-primary">Chat Assistant</h1>
        <p className="text-text-secondary text-sm mt-1">Ask AI about your marketing performance and insights</p>
      </div>

      <div className="flex-1 bg-surface-elevated rounded-lg border border-border-primary p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-text-tertiary text-center">
            <div>
              <p className="text-xl font-bold text-text-secondary mb-2">No messages yet</p>
              <p className="text-sm">Ask about campaign performance, ROI, spend analysis, trends, and more</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-primary-500 text-white rounded-br-none"
                  : "bg-surface-base text-text-primary rounded-bl-none border border-border-primary"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-base px-4 py-3 rounded-lg border border-border-primary rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask about your campaigns..."
          className="flex-1 px-4 py-2 bg-surface-hover border border-border-primary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium rounded transition-colors disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
