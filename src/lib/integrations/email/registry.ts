import type { EmailProvider } from "./types";
import { outlookProvider } from "./outlook";
import { gmailProvider } from "./gmail";

const providers: Record<string, EmailProvider> = {
  outlook: outlookProvider,
  google: gmailProvider,
};

/** Extension point for future providers — add a file + a registry entry, nothing else. */
export function getEmailProvider(name: string): EmailProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unsupported email provider: ${name}`);
  return provider;
}
