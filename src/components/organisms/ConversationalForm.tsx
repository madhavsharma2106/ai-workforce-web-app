"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Textarea } from "@/components/atoms";
import type {
  OnboardingQuestion,
  OnboardingTranscriptEntry,
  NextQuestionResult,
} from "@/lib/onboardingQuestions";

export type {
  OnboardingQuestion as ConversationalFormQuestion,
  OnboardingTranscriptEntry as TranscriptEntry,
  NextQuestionResult,
} from "@/lib/onboardingQuestions";

type Props = {
  agentName: string;
  confirmLabel: string;
  fetchNextQuestion: (transcript: OnboardingTranscriptEntry[]) => Promise<NextQuestionResult>;
  onComplete: (transcript: OnboardingTranscriptEntry[]) => void | Promise<void>;
};

type Message = {
  id: string;
  from: "agent" | "user";
  text: string;
};

const ConversationalForm = ({
  agentName,
  confirmLabel,
  fetchNextQuestion,
  onComplete,
}: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState<OnboardingTranscriptEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<OnboardingQuestion | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageIdRef = useRef(0);
  const hasLoadedInitial = useRef(false);

  const loadNext = async (nextTranscript: OnboardingTranscriptEntry[]) => {
    setIsTyping(true);
    setError(false);
    try {
      const result = await fetchNextQuestion(nextTranscript);
      if (result.done) {
        setCurrentQuestion(null);
        setIsComplete(true);
        if (result.message) {
          setMessages((current) => [
            ...current,
            {
              id: `q${messageIdRef.current++}`,
              from: "agent",
              text: result.message as string,
            },
          ]);
        }
      } else {
        setCurrentQuestion(result.question);
        setMessages((current) => [
          ...current,
          {
            id: `q${messageIdRef.current++}`,
            from: "agent",
            text: result.question.prompt,
          },
        ]);
      }
    } catch {
      setError(true);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    // Fetch the opening question once on mount — the resulting setState
    // happens asynchronously after the LLM call resolves, not synchronously
    // within the effect body. Guarded against Strict Mode's dev-only
    // mount→unmount→remount, which would otherwise fire this twice and,
    // since the question is LLM-generated (non-deterministic), append two
    // differently-worded opening questions instead of deduping to one.
    if (hasLoadedInitial.current) return;
    hasLoadedInitial.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNext([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isTyping) inputRef.current?.focus();
  }, [isTyping, currentQuestion]);

  const submitAnswer = (rawValue: string) => {
    if (!currentQuestion) return;
    const value = rawValue.trim();
    if (!value && !currentQuestion.optional) return;

    const updatedTranscript = [
      ...transcript,
      { prompt: currentQuestion.prompt, answer: value },
    ];
    setTranscript(updatedTranscript);
    setMessages((current) => [
      ...current,
      {
        id: `a${messageIdRef.current++}`,
        from: "user",
        text: value || "(skipped)",
      },
    ]);
    setInputValue("");
    setCurrentQuestion(null);
    void loadNext(updatedTranscript);
  };

  const retry = () => void loadNext(transcript);

  const confirm = async () => {
    setSubmitting(true);
    try {
      await onComplete(transcript);
    } finally {
      setSubmitting(false);
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
        {error && !isTyping && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-600">
              Something went wrong on our end.
            </p>
            <Button variant="secondary" onClick={retry}>
              Retry
            </Button>
          </div>
        )}

        {!error && currentQuestion && !isTyping && (
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

        {!error && isComplete && !isTyping && (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            className="sm:w-auto"
            onClick={confirm}
            disabled={submitting}
          >
            {submitting ? "Saving…" : confirmLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ConversationalForm;
