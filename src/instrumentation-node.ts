import { logs } from "@opentelemetry/api-logs";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Backend for src/lib/log.ts. Set up here, once, at server boot — app code
// never imports this file or knows PostHog is involved; it only ever talks
// to the vendor-neutral @opentelemetry/api-logs interface. To point logs at
// a different backend later (Axiom, Datadog, a self-hosted OTel Collector,
// ...), change the exporter's `url`/`headers` below — nothing else moves.
if (key) {
  const provider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "web-app" }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: `${host}/i/v1/logs`,
          headers: { Authorization: `Bearer ${key}` },
        }),
      }),
    ],
  });

  logs.setGlobalLoggerProvider(provider);
}
