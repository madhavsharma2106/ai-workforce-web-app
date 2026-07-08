"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

/**
 * Minimal test harness proving the chat plumbing (conversations/messages +
 * streaming) end-to-end — not the real product chat UI. See docs/AGENTS.md.
 */
export default function TestChat({
  employeeId,
  employeeName,
  initialMessages,
}: {
  employeeId: string;
  employeeName: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const { messages, status, sendMessage } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: `/api/employees/${employeeId}/chat` }),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role === "user" ? "You" : employeeName}: </strong>
            {message.parts.map((part, index) =>
              part.type === "text" ? <span key={index}>{part.text}</span> : null,
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={status !== "ready"}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2"
          placeholder="Say something..."
        />
        <button
          type="submit"
          disabled={status !== "ready"}
          className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
