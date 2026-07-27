"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PiMicrosoftOutlookLogo } from "react-icons/pi";
import { SiGmail } from "react-icons/si";
import {
  Badge,
  Button,
  Card,
  Eyebrow,
  Heading,
  Text,
} from "@/components/atoms";
import { Alert } from "@/components/molecules";
import type { MailboxConnection } from "@/lib/mailboxConnections";

type Props = {
  connection: MailboxConnection | null;
};

export const SettingsHome = ({ connection }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [disconnecting, setDisconnecting] = useState(false);

  const mailboxParam = searchParams.get("mailbox");

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/mailbox/disconnect", { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Failed to disconnect mailbox", error);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Heading as="h1" size="lg">
        Settings
      </Heading>

      {mailboxParam === "connected" && (
        <Alert variant="info">Mailbox connected.</Alert>
      )}
      {mailboxParam === "error" && (
        <Alert variant="error">
          Couldn&apos;t connect your mailbox — try again.
        </Alert>
      )}

      <Card as="section" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Eyebrow>Connected accounts</Eyebrow>
            <Heading as="h2" size="md" className="mt-1">
              Mailbox
            </Heading>
            <Text size="sm" tone="muted" className="mt-2 max-w-lg">
              Oliver sends approved outreach from your own mailbox — never from
              an address of his own.
            </Text>
          </div>
          {connection && <Badge tone="accent">Connected</Badge>}
        </div>

        {connection ? (
          <div className="flex items-center justify-between rounded-md border border-(--border) px-4 py-3">
            <div className="flex items-center gap-2">
              {connection.provider === "google" ? (
                <SiGmail className="size-4 shrink-0" />
              ) : (
                <PiMicrosoftOutlookLogo className="size-4 shrink-0" />
              )}
              <Text size="sm">Connected as {connection.email}</Text>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <a href="/api/integrations/outlook/connect">
              <Button className="inline-flex items-center gap-2">
                <PiMicrosoftOutlookLogo className="size-4 shrink-0" />
                Connect Outlook
              </Button>
            </a>
            <a href="/api/integrations/google/connect">
              <Button
                variant="secondary"
                className="inline-flex items-center gap-2"
              >
                <SiGmail className="size-4 shrink-0" />
                Connect Gmail
              </Button>
            </a>
          </div>
        )}
      </Card>
    </main>
  );
};
