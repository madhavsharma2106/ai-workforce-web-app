import { PostHogAnalyticsClient } from "./posthog";
import type { AnalyticsClient } from "./types";

// The only PostHog-specific line in this module. Swap the backend here to
// move server-side event capture to a different vendor — call sites below,
// and everywhere that imports captureServerEvent, don't change.
const client: AnalyticsClient = new PostHogAnalyticsClient();

/** Captures a server-side event (API routes, Inngest jobs). No-ops if analytics isn't configured. */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  return client.capture(distinctId, event, properties);
}
