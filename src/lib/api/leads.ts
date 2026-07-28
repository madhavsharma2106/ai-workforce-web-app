export async function patchLead(
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function revealLeadEmail(
  personId: string,
  leadId: string,
): Promise<{ email?: string }> {
  const response = await fetch("/api/leads/reveal-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personId, leadId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Failed to reveal email.");
  return data;
}

export async function retryDraft(id: string): Promise<void> {
  await fetch(`/api/leads/${id}/retry-draft`, { method: "POST" });
}

export async function redraftLead(id: string, message?: string): Promise<void> {
  await fetch(`/api/leads/${id}/redraft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function retrySend(id: string): Promise<void> {
  await fetch(`/api/leads/${id}/retry-send`, { method: "POST" });
}

export async function saveDraftToMailbox(id: string): Promise<void> {
  await fetch(`/api/leads/${id}/save-draft`, { method: "POST" });
}
