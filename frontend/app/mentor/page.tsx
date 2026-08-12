"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Zap, Bot, User } from "lucide-react";
import { clsx } from "clsx";
import Navbar from "@/components/Navbar";
import { ChatSkeleton } from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { getMentorHistory, sendMentorMessage } from "@/lib/api";
import type { MentorMessage } from "@/lib/types";

const QUICK_PROMPTS = [
  "How do I prepare for system design interviews?",
  "What AWS services should I learn first?",
  "How can I improve my portfolio projects?",
  "Create a study plan for the next 4 weeks",
];

function MessageBubble({ msg }: { msg: MentorMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={clsx("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={clsx(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-brand-500/20 border border-brand-500/40"
            : "bg-purple-500/20 border border-purple-500/40"
        )}
      >
        {isUser ? (
          <User size={14} className="text-brand-300" />
        ) : (
          <Bot size={14} className="text-purple-300" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-brand-600/30 border border-brand-500/30 text-slate-100"
            : "rounded-tl-sm bg-surface-muted border border-surface-border text-slate-200"
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className="mt-1 text-xs text-slate-600">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/40">
        <Bot size={14} className="text-purple-300" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface-muted border border-surface-border px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-slate-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MentorPage() {
  const [messages,  setMessages]  = useState<MentorMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        setMessages(await getMentorHistory());
      } catch (e: any) {
        setError(e.message ?? "Failed to load chat history");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    const userMsg: MentorMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const reply = await sendMentorMessage(content, messages);
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] flex-col mx-auto max-w-3xl px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-surface-border py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg shadow-brand-600/20">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100">AI Career Mentor</h1>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-slate-400">Online · Powered by Gemini AI</p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {loading ? (
            <>
              <ChatSkeleton />
              <ChatSkeleton />
            </>
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={`${msg.timestamp}-${i}`} msg={msg} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Quick prompts */}
        {!loading && !error && messages.length <= 1 && (
          <div className="pb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="rounded-xl border border-surface-border bg-surface-muted px-3 py-1.5 text-xs text-slate-400 hover:border-brand-500/40 hover:text-slate-200 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-surface-border py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI mentor anything…"
                rows={1}
                disabled={sending || loading}
                aria-label="Message input"
                className={clsx(
                  "input-field resize-none min-h-[48px] max-h-[160px] pr-4 py-3",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
                }}
              />
              <p className="mt-1 text-xs text-slate-600 text-right">Enter to send · Shift+Enter for newline</p>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending || loading}
              className="btn-primary p-3 h-12 w-12 flex-shrink-0 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
