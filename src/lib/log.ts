import {
  logs,
  SeverityNumber,
  type LogAttributes,
} from "@opentelemetry/api-logs";

const logger = logs.getLogger("web-app");

type Attributes = LogAttributes;

function emit(
  severityNumber: SeverityNumber,
  severityText: string,
  message: string,
  attributes?: Attributes,
) {
  logger.emit({
    severityNumber,
    severityText,
    body: message,
    attributes,
  });

  const consoleFn =
    severityNumber >= SeverityNumber.ERROR
      ? console.error
      : severityNumber >= SeverityNumber.WARN
        ? console.warn
        : console.log;
  consoleFn(message, attributes ?? "");
}

/**
 * Server-side structured logging. Backed by the OpenTelemetry Logs API
 * (see src/instrumentation.node.ts for where records currently ship to —
 * PostHog today) — call sites here never change if that destination does.
 */
export const log = {
  debug: (message: string, attributes?: Attributes) =>
    emit(SeverityNumber.DEBUG, "DEBUG", message, attributes),
  info: (message: string, attributes?: Attributes) =>
    emit(SeverityNumber.INFO, "INFO", message, attributes),
  warn: (message: string, attributes?: Attributes) =>
    emit(SeverityNumber.WARN, "WARN", message, attributes),
  error: (message: string, attributes?: Attributes) =>
    emit(SeverityNumber.ERROR, "ERROR", message, attributes),
};
