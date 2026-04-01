"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex size-7 flex-shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-[#C9A84C]"
            : "bg-white/10 border border-[#C9A84C]/30"
        }`}
      >
        {isUser ? (
          <User className="size-3.5 text-[#0A1628]" />
        ) : (
          <Bot className="size-3.5 text-[#C9A84C]" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "rounded-tr-sm bg-[#C9A84C] text-[#0A1628] font-medium"
            : "rounded-tl-sm bg-white/10 text-slate-100 border border-white/10"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none prose-invert prose-headings:text-[#C9A84C] prose-strong:text-[#C9A84C] prose-a:text-[#C9A84C]">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 border border-[#C9A84C]/30">
        <Bot className="size-3.5 text-[#C9A84C]" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white/10 border border-white/10 px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-[#C9A84C]/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AiAssistant() {
  const { org } = useAuth();
  const orgId = org?.id ?? "org-001";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened; Escape to close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const { reply } = await apiPost<{ reply: string }>(
        `/orgs/${orgId}/support/chat`,
        { messages: newMessages },
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to get a response.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const SUGGESTIONS = [
    "What are my critical compliance gaps?",
    "Summarize my audit readiness",
    "What should I remediate first?",
    "How do I generate an evidence package?",
  ];

  return (
    <>
      {/* Glassmorphism panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-assistant-title"
          className="fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl shadow-2xl"
          style={{
            background: "rgba(10, 22, 40, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(201, 168, 76, 0.35)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: "rgba(201,168,76,0.2)" }}
          >
            <div
              className="flex size-8 items-center justify-center rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.1) 100%)",
                border: "1px solid rgba(201,168,76,0.4)",
              }}
              aria-hidden="true"
            >
              <Sparkles className="size-4 text-[#C9A84C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                id="ai-assistant-title"
                className="text-sm font-semibold text-white"
              >
                Pactura AI
              </p>
              <p className="text-xs text-white/50">Compliance intelligence</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close AI assistant"
              className="size-7 text-white/50 hover:text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            aria-live="polite"
            aria-label="AI assistant conversation"
            className="h-72 overflow-y-auto px-4 py-4 space-y-4"
          >
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <p className="text-xs text-white/50">
                  Ask about compliance gaps, risk areas, or remediation steps.
                </p>
                <div className="grid grid-cols-1 gap-1.5 w-full">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                        inputRef.current?.focus();
                      }}
                      className="text-left rounded-lg px-3 py-2 text-xs text-white/60 transition-colors hover:text-white/90"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(201,168,76,0.15)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {loading && <TypingIndicator />}

            {error && (
              <div
                role="alert"
                className="rounded-lg px-3 py-2 text-xs text-red-300"
                style={{
                  background: "rgba(220,38,38,0.15)",
                  border: "1px solid rgba(220,38,38,0.3)",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 border-t"
            style={{ borderColor: "rgba(201,168,76,0.15)" }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor="ai-assistant-input" className="sr-only">
                Ask Pactura AI
              </label>
              <textarea
                id="ai-assistant-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about compliance, gaps, risk…"
                rows={1}
                disabled={loading}
                aria-disabled={loading}
                className="flex-1 resize-none rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50 max-h-28 overflow-y-auto"
                style={{
                  minHeight: "42px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              />
              <Button
                size="icon"
                aria-label={loading ? "Sending…" : "Send message"}
                disabled={!input.trim() || loading}
                onClick={handleSend}
                className="size-[42px] flex-shrink-0 rounded-lg disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #C9A84C 0%, #a8893d 100%)",
                  color: "#0A1628",
                }}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-white/25">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Gold Shield trigger FAB */}
      <button
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628]"
        style={{
          background: "linear-gradient(135deg, #C9A84C 0%, #a8893d 100%)",
          boxShadow:
            "0 0 0 1px rgba(201,168,76,0.5), 0 8px 32px rgba(201,168,76,0.35), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {open ? (
          <X className="size-6 text-[#0A1628]" aria-hidden="true" />
        ) : (
          <Shield className="size-6 text-[#0A1628]" aria-hidden="true" />
        )}
      </button>
    </>
  );
}
