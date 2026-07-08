"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, EmployeeAvatar, Eyebrow, Heading, Input, Text, Textarea } from "@/components/atoms";
import { BUSINESS_PROFILE_SECTIONS, parseProfileMarkdown } from "@/lib/businessProfile";
import { ROLE_LABELS, ROLE_TITLES, type Employee } from "@/lib/employees";

type Field = {
  key: string;
  label: string;
  placeholder: string;
  optional?: boolean;
  chips?: string[];
  multiline?: boolean;
};

const FIELDS: Field[] = [
  { key: "businessName", label: "Business name", placeholder: "Your business name" },
  {
    key: "businessDescription",
    label: "What your business does",
    placeholder: "e.g. We build custom video ads for B2B SaaS companies...",
    multiline: true,
  },
  {
    key: "idealClient",
    label: "Ideal client",
    placeholder: "e.g. Series A-C SaaS companies with a sales team...",
    multiline: true,
  },
  {
    key: "badLeadCriteria",
    label: "Bad-fit criteria",
    placeholder: "e.g. Agencies, consumer brands, companies too small...",
    multiline: true,
  },
  {
    key: "valueProp",
    label: "Value proposition",
    placeholder: "e.g. Faster turnaround, better creative, lower cost...",
    multiline: true,
  },
  {
    key: "tone",
    label: "Tone",
    placeholder: "Formal, casual, direct...",
    chips: ["Formal", "Casual & friendly", "Direct, no-fluff"],
  },
  {
    key: "priorities",
    label: "Current priorities",
    placeholder: "Optional — a segment, campaign, or push this quarter",
    optional: true,
    multiline: true,
  },
  {
    key: "dosDonts",
    label: "Do's and don'ts",
    placeholder: "Optional — e.g. never mention pricing, avoid competitor X",
    optional: true,
    multiline: true,
  },
  {
    key: "name",
    label: "Your name",
    placeholder: "Optional",
    optional: true,
  },
];

const ROLE_BLURBS: Partial<Record<Employee["role"], string>> = {
  lead_sourcer: "every search and email draft",
  sales_representative: "outreach context and case studies",
};

type Props = {
  employeeId: string;
  businessName: string | null;
  contactName: string | null;
  profileMd: string;
  updatedAt: string | null;
  otherEmployees: Employee[];
};

const buildAnswers = (
  businessName: string | null,
  contactName: string | null,
  profileMd: string,
): Record<string, string> => ({
  businessName: businessName ?? "",
  name: contactName ?? "",
  ...parseProfileMarkdown(profileMd),
});

const AccountManagerHome = ({
  employeeId,
  businessName,
  contactName,
  profileMd,
  updatedAt,
  otherEmployees,
}: Props) => {
  const [answers, setAnswers] = useState(() =>
    buildAnswers(businessName, contactName, profileMd),
  );
  const [savedAt, setSavedAt] = useState(updatedAt);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(answers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraft(answers);
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
          body: JSON.stringify({ answers: draft }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to save.");

      setAnswers(
        buildAnswers(
          data.profile.business_name,
          data.profile.contact_name,
          data.profile.profile_md,
        ),
      );
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

  const filledSections = BUSINESS_PROFILE_SECTIONS.filter(
    (section) => answers[section.key],
  ).length;

  return (
    <main className="space-y-10">
      <Card as="section" padding="lg">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <EmployeeAvatar seed={employeeId} size="lg" />
            <div>
              <Eyebrow>Active employee</Eyebrow>
              <Heading as="h2" size="md" className="mt-1">
                Hi, I&apos;m Alex
              </Heading>
              <Text size="sm" tone="muted" className="mt-2 max-w-xl">
                I keep {answers.businessName ? `${answers.businessName}'s` : "your"}{" "}
                Business Profile current so everyone you hire understands your
                business without asking you the basics twice.
              </Text>
            </div>
          </div>
          <Badge tone="accent" size="md">
            Living profile
          </Badge>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 sm:grid-cols-3">
          {[
            { label: "Supporting", value: `${otherEmployees.length} employee${otherEmployees.length === 1 ? "" : "s"}` },
            {
              label: "Profile completeness",
              value: `${filledSections}/${BUSINESS_PROFILE_SECTIONS.length} sections`,
            },
            { label: "Updated", value: updatedLabel ?? "Never" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-5">
              <Text size="xs" tone="muted" weight="medium">
                {stat.label}
              </Text>
              <Text size="xl" weight="semibold" className="mt-2 font-mono">
                {stat.value}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      <Card as="section" padding="lg" className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Eyebrow>Business Profile</Eyebrow>
            <Heading as="h3" size="md" className="mt-1">
              What I know about your business
            </Heading>
          </div>
          {mode === "view" && (
            <Button variant="secondary" onClick={startEdit}>
              Update profile →
            </Button>
          )}
        </div>

        {mode === "view" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.filter((field) => !field.optional || answers[field.key]).map(
              (field) => (
                <div key={field.key}>
                  <Text size="xs" tone="muted" weight="medium">
                    {field.label}
                  </Text>
                  <Text size="sm" className="mt-1 whitespace-pre-wrap">
                    {answers[field.key] || "(not provided)"}
                  </Text>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <Text size="xs" tone="muted" weight="medium" className="mb-1.5">
                  {field.label}
                </Text>
                {field.chips && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {field.chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({ ...current, [field.key]: chip }))
                        }
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-gray-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
                {field.multiline ? (
                  <Textarea
                    value={draft[field.key] || ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    rows={2}
                    className="resize-none"
                  />
                ) : (
                  <Input
                    value={draft[field.key] || ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

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

      <Card as="section" padding="lg" className="space-y-4">
        <Eyebrow>Supporting</Eyebrow>
        {otherEmployees.length > 0 ? (
          <div className="space-y-3">
            {otherEmployees.map((employee) => (
              <div key={employee.id} className="flex items-start gap-3">
                <EmployeeAvatar seed={employee.id} size="sm" className="shrink-0" />
                <Text size="sm">
                  I make sure{" "}
                  <span className="font-medium">
                    {ROLE_LABELS[employee.role]} ({ROLE_TITLES[employee.role]})
                  </span>{" "}
                  has this for {ROLE_BLURBS[employee.role] ?? "day-to-day work"}.
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <Text size="sm" tone="muted">
            I&apos;m not supporting anyone yet —{" "}
            <Link href="/dashboard" className="text-gray-900 underline">
              hire an employee from the dashboard
            </Link>{" "}
            to put this to work.
          </Text>
        )}
      </Card>
    </main>
  );
};

export default AccountManagerHome;
