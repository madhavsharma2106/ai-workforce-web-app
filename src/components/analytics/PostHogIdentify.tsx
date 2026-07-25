"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type Props = {
  userId: string;
  email: string | null;
};

/** Links analytics events captured before login (anonymous) to this user. */
export function PostHogIdentify({ userId, email }: Props) {
  useEffect(() => {
    if (!posthog.__loaded) return;
    posthog.identify(userId, email ? { email } : undefined);
  }, [userId, email]);

  return null;
}
