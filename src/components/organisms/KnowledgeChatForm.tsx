"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Textarea } from "@/components/atoms";
import type { ChatMessage } from "@/lib/knowledgeChat";

type Props = {
  agentName: string;
  opener: string;
  sendMessage: (messages: ChatMessage[]) => Promise<{ reply: string }>;
  onSave: (messages: ChatMessage[]) => void | Promise<void>;
};

type UiMessage = { id: string; role: "assistant" | "user"; content: string };

const toChatMessages = (messages: UiMessage[]): ChatMessage[] =>
  messages.map(({ role, content }) => ({ role, content }));

export const KnowledgeChatForm = ({
  agentName,
  opener,
  sendMessage,
  onSave,
}: Props) => {
  const [messages, setMessages] = useState<UiMessage[]>([
    { id: "opener", role: "assistant", content: opener },
  ]);
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

  const send = async (value: string, history: UiMessage[]) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const withUser: UiMessage[] = [
      ...history,
      { id: `u${idRef.current++}`, role: "user", content: trimmed },
    ];
    setMessages(withUser);
    setInputValue("");
    setError(false);
    setIsSending(true);
    try {
      const { reply } = await sendMessage(toChatMessages(withUser));
      setMessages((current) => [
        ...current,
        { id: `a${idRef.current++}`, role: "assistant", content: reply },
      ]);
    } catch {
      setError(true);
    } finally {
      setIsSending(false);
    }
  };

  const retry = () => {
    const last = messages[messages.length - 1];
    if (last?.role !== "user") return;
    void send(last.content, messages.slice(0, -1));
  };

  const hasUserMessage = messages.some((message) => message.role === "user");

  const save = async () => {
    setSaving(true);
    try {
      await onSave(toChatMessages(messages));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="none" className="flex h-full flex-col bg-white">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-5"
        style={{ maxHeight: "26rem" }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.role === "assistant" && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-500">
                  {agentName}
                </p>
              )}
              {message.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-3.5 py-3">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: `${dot * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2.5 border-t border-gray-200 p-4">
        {error && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-600">
              Something went wrong on our end.
            </p>
            <Button variant="secondary" onClick={retry}>
              Retry
            </Button>
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(inputValue, messages);
          }}
          className="space-y-2.5"
        >
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(inputValue, messages);
              }
            }}
            placeholder={`Message ${agentName}...`}
            rows={2}
            className="resize-none"
            disabled={isSending}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={save}
              disabled={!hasUserMessage || saving || isSending}
            >
              {saving ? "Saving…" : "Save updates"}
            </Button>
            <Button type="submit" disabled={isSending || !inputValue.trim()}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};
