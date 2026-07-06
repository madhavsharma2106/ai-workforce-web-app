"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/atoms";
import { Alert } from "@/components/molecules";

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
          <Alert variant="info">
            Check your inbox at <strong>{email}</strong> for a sign-in link.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
            {status === "error" && (
              <p className="text-sm text-red-600">
                {errorMessage ?? "Something went wrong. Please try again."}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthGate;
