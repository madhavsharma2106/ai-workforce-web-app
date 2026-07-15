"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Eyebrow, Heading, Text, Textarea } from "@/components/atoms";
import { Markdown } from "@/components/molecules";
import KnowledgeRefreshModal from "@/components/organisms/KnowledgeRefreshModal";
import { updateInstructions } from "@/lib/api/employees";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";

const MISSION_LINE: Partial<Record<EmployeeRole, string>> = {
  lead_sourcer: "I research and qualify companies that match your ideal customer, every day.",
  sales_representative: "I draft outreach for the leads you approve, grounded in Emma's research.",
};

type Props = {
  employeeId: string;
  role: EmployeeRole;
  initialInstructionsMd: string | null;
  accountManagerId: string | null;
};

const InstructionsPanel = ({ employeeId, role, initialInstructionsMd, accountManagerId }: Props) => {
  const [instructionsMd, setInstructionsMd] = useState(initialInstructionsMd ?? "");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(instructionsMd);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapCheckOpen, setGapCheckOpen] = useState(false);

  const startEdit = () => {
    setDraft(instructionsMd);
    setError(null);
    setMode("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = await updateInstructions(employeeId, draft);
      setInstructionsMd(data.instructionsMd ?? "");
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card as="section" padding="lg" className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow>What I&apos;m working off of</Eyebrow>
          <Heading as="h3" size="md" className="mt-1">
            Instructions
          </Heading>
        </div>
        {mode === "view" && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setGapCheckOpen(true)}>
              Check for gaps
            </Button>
            <Button variant="secondary" onClick={startEdit}>
              Update instructions
            </Button>
          </div>
        )}
      </div>

      {MISSION_LINE[role] && (
        <Text size="sm" tone="muted">
          {MISSION_LINE[role]}
        </Text>
      )}

      <Text size="xs" tone="muted">
        I also work from the Business Profile Alex maintains
        {accountManagerId ? (
          <>
            {" — "}
            <Link href={`/employee/${accountManagerId}`} className="underline underline-offset-2">
              see it on Alex&apos;s page
            </Link>
          </>
        ) : null}
        . What&apos;s below is what you&apos;ve told me specifically.
      </Text>

      {mode === "view" ? (
        instructionsMd ? (
          <Markdown content={instructionsMd} />
        ) : (
          <Text size="sm" tone="muted">
            Nothing specific yet — add anything I should keep in mind that&apos;s just for me.
          </Text>
        )
      ) : (
        <div className="space-y-4">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Sign-off style, things to never claim, pacing preferences..."
            rows={8}
            className="resize-none"
          />
          {error && (
            <Text size="sm" className="text-red-600">
              {error}
            </Text>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMode("view")} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      <KnowledgeRefreshModal
        open={gapCheckOpen}
        onClose={() => setGapCheckOpen(false)}
        employeeId={employeeId}
        role={role}
        agentName={ROLE_LABELS[role]}
        onApplied={(result) => {
          if ("instructionsMd" in result) {
            setInstructionsMd(result.instructionsMd ?? "");
          }
        }}
      />
    </Card>
  );
};

export default InstructionsPanel;
