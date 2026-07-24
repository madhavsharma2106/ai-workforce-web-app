import type { EmailProvider } from "./types";
import { outlookProvider } from "./outlook";

const providers: Record<string, EmailProvider> = {
  outlook: outlookProvider,
};

/** Extension point for future providers (Gmail, etc.) — add a file + a registry entry, nothing else. */
export function getEmailProvider(name: string): EmailProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unsupported email provider: ${name}`);
  return provider;
}
