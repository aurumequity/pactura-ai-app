"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Send, Sparkles, Bot, User } from "lucide-react";
import { apiPost } from "@/lib/api";
import ReactMarkdown from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DocumentAiChatProps {
  orgId: string;
  docId: string;
  docName: string;
  open: boolean;
  onClose: () => void;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex size-7 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary" : "bg-secondary"
        }`}
      >
        {isUser ? (
          <User className="size-3.5 text-primary-foreground" />
        ) : (
          <Bot className="size-3.5 text-muted-foreground" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-secondary text-foreground"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-headings:text-[#1E2F5C] prose-strong:text-[#1E2F5C]">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
        <Bot className="size-3.5 text-muted-foreground" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentAiChat({
  orgId,
  docId,
  docName,
  open,
  onClose,
}: DocumentAiChatProps) {
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

  // Focus input when opened; close on Escape
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
        `/orgs/${orgId}/documents/${docId}/chat`,
        { messages: newMessages },
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to get a response.";
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

  function handleClose() {
    setMessages([]);
    setInput("");
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-dialog-title"
        className="fixed bottom-0 right-0 z-50 flex h-[600px] w-full max-w-md flex-col rounded-tl-2xl rounded-tr-2xl border border-border bg-background shadow-2xl sm:bottom-6 sm:right-6 sm:rounded-2xl"
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 rounded-t-2xl border-b border-border px-4 py-3"
          style={{ background: "linear-gradient(135deg, #1E2F5C 0%, #2a3d72 100%)" }}
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/20" aria-hidden="true">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p id="chat-dialog-title" className="text-sm font-semibold text-white">Document Assistant</p>
            <p className="text-xs text-white/70 truncate">{docName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close document assistant"
            className="size-7 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleClose}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          aria-live="polite"
          aria-label="Conversation"
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                <Sparkles className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ask me about this document
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  I can help with compliance gaps, risk areas, remediation steps,
                  or anything else about this contract.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 w-full max-w-xs mt-1">
                {[
                  "What are the highest-risk compliance gaps?",
                  "Summarize the anomalies found",
                  "What should I remediate first?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-left rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div aria-live="polite" aria-label="Assistant is typing">
              <TypingIndicator />
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-3 py-3">
          <div className="flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Ask a question about {docName}
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this document…"
              rows={1}
              disabled={loading}
              aria-disabled={loading}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-32 overflow-y-auto"
              style={{ minHeight: "42px" }}
            />
            <Button
              size="icon"
              aria-label={loading ? "Sending…" : "Send message"}
              disabled={!input.trim() || loading}
              onClick={handleSend}
              className="size-[42px] flex-shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
