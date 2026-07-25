export interface AnalyticsClient {
  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): Promise<void>;
}
