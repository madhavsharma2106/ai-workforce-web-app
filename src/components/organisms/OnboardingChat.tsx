"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Textarea } from "@/components/atoms";

export type OnboardingResult = {
  clientDescription: string;
  badLeadCriteria: string;
  name: string;
};

type Props = {
  onComplete: (result: OnboardingResult) => void;
};

type Message = {
  id: string;
  from: "emma" | "user";
  text: string;
};

type QuestionKey = "clientDescription" | "badLeadCriteria" | "name";

type Question = {
  key: QuestionKey;
  prompt: string;
  placeholder: string;
  optional?: boolean;
  chips?: string[];
};

const questions: Question[] = [
  {
    key: "clientDescription",
    prompt:
      "Hi, I'm Emma — I'll be sourcing leads and drafting outreach for you. First: what does your ideal client look like?",
    placeholder: "e.g. B2B SaaS companies with weak video presence...",
    chips: [
      "B2B SaaS companies with weak online presence",
      "Local service businesses ready to grow",
      "E-commerce brands scaling past $1M",
    ],
  },
  {
    key: "badLeadCriteria",
    prompt:
      "Good to know. And what should I steer clear of — what does a bad-fit lead look like?",
    placeholder: "e.g. Agencies, consumer brands, companies too small...",
    chips: [
      "Agencies and consultants",
      "Companies too small to afford us",
      "Already working with a competitor",
    ],
  },
  {
    key: "name",
    prompt: "Last thing before Gmail — what should I call you?",
    placeholder: "Your name (optional)",
    optional: true,
  },
];

type GmailState = "idle" | "connecting" | "connected";

const GMAIL_PROMPT =
  "One last thing — I need access to your Gmail to send approved emails on your behalf.";

const OnboardingChat = ({ onComplete }: Props) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "q0", from: "emma", text: questions[0].prompt },
  ]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [gmailState, setGmailState] = useState<GmailState>("idle");
  const [answers, setAnswers] = useState<OnboardingResult>({
    clientDescription: "",
    badLeadCriteria: "",
    name: "",
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isTyping, gmailState]);

  useEffect(() => {
    if (!isTyping) inputRef.current?.focus();
  }, [isTyping, questionIndex]);

  const askNext = (nextIndex: number, updatedAnswers: OnboardingResult) => {
    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      if (nextIndex < questions.length) {
        setMessages((current) => [
          ...current,
          {
            id: `q${nextIndex}`,
            from: "emma",
            text: questions[nextIndex].prompt,
          },
        ]);
        setQuestionIndex(nextIndex);
      } else {
        setMessages((current) => [
          ...current,
          {
            id: "gmail-ask",
            from: "emma",
            text: updatedAnswers.name
              ? `Great, ${updatedAnswers.name}! ${GMAIL_PROMPT}`
              : `Great! ${GMAIL_PROMPT}`,
          },
        ]);
        setQuestionIndex(questions.length);
      }
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
    askNext(questionIndex + 1, updatedAnswers);
  };

  const handleConnectGmail = () => {
    setGmailState("connecting");
    window.setTimeout(() => {
      setGmailState("connected");
      setMessages((current) => [
        ...current,
        {
          id: "gmail-connected",
          from: "emma",
          text: "Gmail connected. I'm ready to get to work.",
        },
      ]);
    }, 1200);
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
              {message.from === "emma" && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-500">
                  Emma
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
                <Button
                  variant="secondary"
                  onClick={() => submitAnswer("")}
                >
                  Skip
                </Button>
              )}
              <Button type="submit">Send</Button>
            </div>
          </form>
        )}

        {!awaitingQuestion && !isTyping && gmailState !== "connected" && (
          <Button
            size="lg"
            fullWidth
            className="sm:w-auto"
            onClick={handleConnectGmail}
            disabled={gmailState === "connecting"}
          >
            {gmailState === "connecting" ? "Connecting to Gmail…" : "Connect Gmail"}
          </Button>
        )}

        {!awaitingQuestion && gmailState === "connected" && (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            className="sm:w-auto"
            onClick={() => onComplete(answers)}
          >
            Confirm hire →
          </Button>
        )}
      </div>
    </Card>
  );
};

export default OnboardingChat;
