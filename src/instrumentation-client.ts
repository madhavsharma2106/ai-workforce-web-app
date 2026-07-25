import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    // Pageviews are captured manually (see PostHogPageView) so SPA
    // navigations under the App Router are tracked correctly.
    capture_pageview: false,
    capture_pageleave: true,
  });
}
