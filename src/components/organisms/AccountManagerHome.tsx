"use client";

import { useState } from "react";
import {
  Button,
  Card,
  EmployeeAvatar,
  Eyebrow,
  Heading,
  Input,
  Text,
  Textarea,
} from "@/components/atoms";
import { Markdown } from "@/components/molecules";
import { ROLE_TITLES } from "@/lib/employees";

type Profile = {
  businessName: string;
  contactName: string;
  profileMd: string;
};

type Props = {
  employeeId: string;
  businessName: string | null;
  contactName: string | null;
  profileMd: string;
  updatedAt: string | null;
};

const AccountManagerHome = ({
  employeeId,
  businessName,
  contactName,
  profileMd,
  updatedAt,
}: Props) => {
  const [profile, setProfile] = useState<Profile>({
    businessName: businessName ?? "",
    contactName: contactName ?? "",
    profileMd,
  });
  const [savedAt, setSavedAt] = useState(updatedAt);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraft(profile);
    setError(null);
    setMode("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/employees/${employeeId}/business-profile`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to save.");

      setProfile({
        businessName: data.profile.business_name ?? "",
        contactName: data.profile.contact_name ?? "",
        profileMd: data.profile.profile_md ?? "",
      });
      setSavedAt(data.profile.updated_at);
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const updatedLabel = savedAt
    ? new Date(savedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="space-y-10">
      <Card as="section" padding="lg">
        <div className="flex items-center gap-4">
          <EmployeeAvatar seed={employeeId} size="lg" />
          <div>
            <Eyebrow>{ROLE_TITLES.account_manager}</Eyebrow>
            <Heading as="h2" size="md" className="mt-1">
              Hi, I&apos;m Alex
            </Heading>
            <Text size="sm" tone="muted" className="mt-2 max-w-xl">
              I keep{" "}
              {profile.businessName ? `${profile.businessName}'s` : "your"}{" "}
              Business Profile current so everyone you hire understands your
              business without asking you the basics twice.
            </Text>
            <Text size="xs" tone="muted" className="mt-3">
              Updated {updatedLabel ?? "never"}
            </Text>
          </div>
        </div>
      </Card>

      <Card as="section" padding="lg" className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Eyebrow>Business Profile</Eyebrow>
            <Heading as="h3" size="md" className="mt-1">
              How I&apos;d describe your business
            </Heading>
          </div>
          {mode === "view" && (
            <Button variant="secondary" onClick={startEdit}>
              Update profile
            </Button>
          )}
        </div>

        {mode === "view" ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Text size="xs" tone="muted" weight="medium">
                  Business name
                </Text>
                <Text size="sm" className="mt-1">
                  {profile.businessName || "(not provided)"}
                </Text>
              </div>
              <div>
                <Text size="xs" tone="muted" weight="medium">
                  Your name
                </Text>
                <Text size="sm" className="mt-1">
                  {profile.contactName || "(not provided)"}
                </Text>
              </div>
            </div>
            <div>
              <Text size="xs" tone="muted" weight="medium">
                Description
              </Text>
              {profile.profileMd ? (
                <Markdown content={profile.profileMd} />
              ) : (
                <Text size="sm" className="mt-1">
                  (not provided)
                </Text>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Text size="xs" tone="muted" weight="medium" className="mb-1.5">
                  Business name
                </Text>
                <Input
                  value={draft.businessName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      businessName: event.target.value,
                    }))
                  }
                  placeholder="Your business name"
                />
              </div>
              <div>
                <Text size="xs" tone="muted" weight="medium" className="mb-1.5">
                  Your name
                </Text>
                <Input
                  value={draft.contactName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      contactName: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <Text size="xs" tone="muted" weight="medium" className="mb-1.5">
                Description
              </Text>
              <Textarea
                value={draft.profileMd}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    profileMd: event.target.value,
                  }))
                }
                placeholder="What your business does, who your ideal client is, what a bad-fit lead looks like, your value prop, tone..."
                rows={14}
                className="resize-none"
              />
            </div>

            {error && (
              <Text size="sm" className="text-red-600">
                {error}
              </Text>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setMode("view")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
};

export default AccountManagerHome;
