"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

const AuthGate = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-sm font-semibold text-white">
          W
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Sign in to Workforce
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            We&apos;ll email you a link to sign in — no password needed.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            Check your inbox at <strong>{email}</strong> for a sign-in link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400"
            />
            {status === "error" && (
              <p className="text-sm text-red-600">
                {errorMessage ?? "Something went wrong. Please try again."}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
            >
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthGate;
