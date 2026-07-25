export async function register() {
  // Edge routes/middleware get a separate, restricted runtime — the Node
  // OTLP exporter (uses Node's http module) doesn't run there.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  await import("./instrumentation-node");
}
