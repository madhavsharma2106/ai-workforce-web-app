"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Card, EmployeeAvatar, Textarea } from "@/components/atoms";
import type { ChatMessage } from "@/lib/knowledgeChat";

type Props = {
  employeeId: string;
  agentName: string;
  opener: string;
  initialMessages: ChatMessage[];
  sendMessage: (message: string) => Promise<{ reply: string }>;
  onSave: () => void | Promise<void>;
};

type UiMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const KnowledgeChatForm = ({
  employeeId,
  agentName,
  opener,
  initialMessages,
  sendMessage,
  onSave,
}: Props) => {
  const [messages, setMessages] = useState<UiMessage[]>(() =>
    initialMessages.length
      ? initialMessages.map((message, index) => ({
          id: `h${index}`,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt ?? new Date().toISOString(),
        }))
      : [
          {
            id: "opener",
            role: "assistant",
            content: opener,
            createdAt: new Date().toISOString(),
          },
        ],
  );
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isSending) inputRef.current?.focus();
  }, [isSending]);

  const deliver = async (content: string) => {
    setError(false);
    setIsSending(true);
    try {
      const { reply } = await sendMessage(content);
      setMessages((current) => [
        ...current,
        {
          id: `a${idRef.current++}`,
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setError(true);
    } finally {
      setIsSending(false);
    }
  };

  const send = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      {
        id: `u${idRef.current++}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInputValue("");
    void deliver(trimmed);
  };

  const retry = () => {
    const last = messages[messages.length - 1];
    if (last?.role !== "user") return;
    void deliver(last.content);
  };

  const hasUserMessage = messages.some((message) => message.role === "user");

  const save = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="none" className="flex h-full flex-col bg-(--surface)">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto p-5"
      >
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          const next = messages[index + 1];
          const startsGroup = !prev || prev.role !== message.role;
          const endsGroup = !next || next.role !== message.role;
          const isAssistant = message.role === "assistant";

          return (
            <div key={message.id}>
              <div
                className={`flex items-end gap-2 ${isAssistant ? "justify-start" : "justify-end"} ${startsGroup ? "mt-3" : "mt-0.5"}`}
              >
                {isAssistant && (
                  <div className="w-7 shrink-0">
                    {startsGroup && (
                      <EmployeeAvatar seed={employeeId} size="sm" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2 text-sm leading-6 ${
                    isAssistant
                      ? "rounded-2xl bg-(--secondary-bg) text-(--body-strong)"
                      : "rounded-2xl bg-(--accent) text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
              {endsGroup && (
                <p
                  className={`mt-1 text-[11px] text-(--muted-faint) ${
                    isAssistant ? "ml-9 text-left" : "text-right"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              )}
            </div>
          );
        })}
        {isSending && (
          <div className="mt-3 flex items-end gap-2">
            <div className="w-7 shrink-0">
              <EmployeeAvatar seed={employeeId} size="sm" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-(--secondary-bg) px-3.5 py-3">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--muted-faint)"
                  style={{ animationDelay: `${dot * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-(--border) p-4">
        {error && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-600">
              Something went wrong on our end.
            </p>
            <button
              type="button"
              onClick={retry}
              className="text-xs font-medium text-(--accent) hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(inputValue);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(inputValue);
              }
            }}
            placeholder={`Message ${agentName}...`}
            rows={1}
            className="max-h-32 flex-1 resize-none"
            disabled={isSending}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={isSending || !inputValue.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--accent) text-white transition hover:bg-(--accent-hover) disabled:bg-(--disabled-bg) disabled:text-(--disabled-text)"
          >
            <Send size={16} />
          </button>
        </form>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={!hasUserMessage || saving || isSending}
            className="text-xs font-medium text-(--muted-faint-3) hover:text-(--accent) hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save updates to What I Know"}
          </button>
        </div>
      </div>
    </Card>
  );
};
