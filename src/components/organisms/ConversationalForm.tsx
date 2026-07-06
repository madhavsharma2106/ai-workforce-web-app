"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Textarea } from "@/components/atoms";

export type ConversationalFormQuestion = {
  key: string;
  prompt: string;
  placeholder: string;
  optional?: boolean;
  chips?: string[];
};

type Props = {
  agentName: string;
  questions: ConversationalFormQuestion[];
  confirmLabel: string;
  onComplete: (answers: Record<string, string>) => void;
};

type Message = {
  id: string;
  from: "agent" | "user";
  text: string;
};

const ConversationalForm = ({
  agentName,
  questions,
  confirmLabel,
  onComplete,
}: Props) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "q0", from: "agent", text: questions[0].prompt },
  ]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isTyping) inputRef.current?.focus();
  }, [isTyping, questionIndex]);

  const askNext = (nextIndex: number) => {
    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      if (nextIndex < questions.length) {
        setMessages((current) => [
          ...current,
          {
            id: `q${nextIndex}`,
            from: "agent",
            text: questions[nextIndex].prompt,
          },
        ]);
      }
      setQuestionIndex(nextIndex);
    }, 550);
  };

  const submitAnswer = (rawValue: string) => {
    const question = questions[questionIndex];
    if (!question) return;
    const value = rawValue.trim();
    if (!value && !question.optional) return;

    const updatedAnswers = { ...answers, [question.key]: value };
    setAnswers(updatedAnswers);
    setMessages((current) => [
      ...current,
      {
        id: `a${questionIndex}`,
        from: "user",
        text: value || "(skipped)",
      },
    ]);
    setInputValue("");
    askNext(questionIndex + 1);
  };

  const awaitingQuestion = questionIndex < questions.length;
  const currentQuestion = questions[questionIndex];

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
            className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-6 ${
                message.from === "user"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.from === "agent" && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-500">
                  {agentName}
                </p>
              )}
              {message.text}
            </div>
          </div>
        ))}
        {isTyping && (
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

      <div className="border-t border-gray-200 p-4">
        {awaitingQuestion && !isTyping && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitAnswer(inputValue);
            }}
            className="space-y-2.5"
          >
            {currentQuestion.chips && (
              <div className="flex flex-wrap gap-1.5">
                {currentQuestion.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => submitAnswer(chip)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-gray-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitAnswer(inputValue);
                }
              }}
              placeholder={currentQuestion.placeholder}
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              {currentQuestion.optional && (
                <Button variant="secondary" onClick={() => submitAnswer("")}>
                  Skip
                </Button>
              )}
              <Button type="submit">Send</Button>
            </div>
          </form>
        )}

        {!awaitingQuestion && !isTyping && (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            className="sm:w-auto"
            onClick={() => onComplete(answers)}
          >
            {confirmLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ConversationalForm;
