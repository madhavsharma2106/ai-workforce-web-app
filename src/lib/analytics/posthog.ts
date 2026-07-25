import { PostHog } from "posthog-node";
import type { AnalyticsClient } from "./types";

export class PostHogAnalyticsClient implements AnalyticsClient {
  private client: PostHog | null = null;

  private getClient(): PostHog | null {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return null;

    if (!this.client) {
      this.client = new PostHog(key, {
        host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      });
    }

    return this.client;
  }

  async capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ) {
    const posthog = this.getClient();
    if (!posthog) return;

    // Flush immediately — API routes and Inngest steps are short-lived, so
    // an un-awaited capture can be dropped before it reaches the network.
    posthog.capture({ distinctId, event, properties });
    await posthog.flush();
  }
}
