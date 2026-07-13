import type { FC } from "react";
import type { Lead } from "@/lib/types";
import { Badge, Button, Card, Eyebrow, Textarea } from "@/components/atoms";

export type { Lead };

type ApprovalStatus = "pending" | "approved" | "rejected";

type Props = {
  lead: Lead;
  status: ApprovalStatus;
  showDraft?: boolean;
  draftText?: string;
  isEditing?: boolean;
  feedbackActive: boolean;
  feedbackReason?: string;
  feedbackOptions?: string[];
  approvedMessage?: string;
  rejectedNote?: string;
  approveDisabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onToggleEdit?: () => void;
  onDraftChange?: (value: string) => void;
  onFeedbackSubmit: (reason: string) => void;
  onRevealEmail: () => void;
  isRevealingEmail: boolean;
};

const statusLabel: Record<
  ApprovalStatus,
  { label: string; tone: "neutral" | "accent" | "danger" }
> = {
  pending: { label: "Pending", tone: "neutral" },
  approved: { label: "Approved", tone: "accent" },
  rejected: { label: "Rejected", tone: "danger" },
};

const DEFAULT_FEEDBACK_OPTIONS = [
  "Too small",
  "Wrong industry",
  "Already contacted",
  "Not enough budget",
  "Other",
];

const titleCase = (value: string) =>
  value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

function companySnapshot(lead: Lead): string | null {
  const parts = [
    lead.industry ? titleCase(lead.industry) : null,
    typeof lead.employeeCount === "number" ? `${lead.employeeCount.toLocaleString()} employees` : null,
    lead.location,
    lead.foundedYear ? `Founded ${lead.foundedYear}` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" • ") : null;
}

const LeadCard: FC<Props> = ({
  lead,
  status,
  showDraft = true,
  draftText,
  isEditing = false,
  feedbackActive,
  feedbackReason,
  feedbackOptions = DEFAULT_FEEDBACK_OPTIONS,
  approvedMessage = "Approved for sending.",
  rejectedNote = "Emma will remember this for next time.",
  approveDisabled = false,
  onApprove,
  onReject,
  onToggleEdit,
  onDraftChange,
  onFeedbackSubmit,
  onRevealEmail,
  isRevealingEmail,
}) => {
  const statusMeta = statusLabel[status];
  const emailLocked = Boolean(lead.personId) && !lead.emailRevealed;
  const snapshot = companySnapshot(lead);

  return (
    <Card
      as="article"
      padding="md"
      className="bg-white transition hover:border-gray-300"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-900 text-sm font-medium text-white">
              {lead.company.charAt(0)}
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                {lead.company}
                {lead.companyLinkedinUrl && (
                  <a
                    href={withProtocol(lead.companyLinkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-normal text-indigo-600 underline decoration-dotted underline-offset-2 hover:text-indigo-700"
                  >
                    LinkedIn
                  </a>
                )}
              </p>
              {lead.website ? (
                <a
                  href={withProtocol(lead.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-gray-400 underline decoration-dotted underline-offset-2 hover:text-gray-600"
                >
                  {lead.website}
                </a>
              ) : (
                <p className="font-mono text-xs text-gray-400">{lead.website}</p>
              )}
            </div>
          </div>
          {snapshot && <p className="text-xs text-gray-500">{snapshot}</p>}
          <div className="space-y-1 text-sm text-gray-500">
            <p>
              <span className="text-gray-400">Decision maker </span>
              <span className="text-gray-700">{lead.decisionMaker}</span>
              {lead.contactLinkedinUrl && (
                <>
                  {" "}
                  <a
                    href={withProtocol(lead.contactLinkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 underline decoration-dotted underline-offset-2 hover:text-indigo-700"
                  >
                    LinkedIn
                  </a>
                </>
              )}
            </p>
            <p>
              <span className="text-gray-400">Email </span>
              {emailLocked ? (
                <button
                  type="button"
                  onClick={onRevealEmail}
                  disabled={isRevealingEmail}
                  className="text-indigo-600 underline decoration-dotted underline-offset-2 transition hover:text-indigo-700 disabled:opacity-60"
                >
                  {isRevealingEmail ? "Revealing…" : "Reveal email"}
                </button>
              ) : (
                <span className="text-gray-700">{lead.email}</span>
              )}
            </p>
          </div>
          <div className="rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
            <Eyebrow tone="muted" tracking="wide">
              Why this is a good fit
            </Eyebrow>
            <p className="mt-1.5">{lead.fit}</p>
            {lead.researchSnippet && (
              <p className="mt-2 text-xs text-gray-500 italic">"{lead.researchSnippet}"</p>
            )}
          </div>
          <p className="text-xs text-gray-400">Sources: {lead.sources}</p>
        </div>

        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {showDraft && (
          <div className="space-y-2 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
            <Eyebrow tone="muted" tracking="wide">
              Draft email
            </Eyebrow>
            {isEditing ? (
              <Textarea
                rows={5}
                value={draftText}
                onChange={(event) => onDraftChange?.(event.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{draftText}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onApprove} disabled={approveDisabled}>
            Approve
          </Button>
          <Button variant="danger" onClick={onReject}>
            Reject
          </Button>
          {showDraft && (
            <Button variant="secondary" onClick={onToggleEdit}>
              {isEditing ? "Done" : "Edit"}
            </Button>
          )}
        </div>

        {status === "approved" && (
          <div className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            {approvedMessage}
          </div>
        )}

        {feedbackActive && (
          <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
            <p className="font-medium text-gray-900">
              Why was this not a good lead?
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {feedbackOptions.map((option) => (
                <Button
                  key={option}
                  variant="secondary"
                  size="sm"
                  className="text-left"
                  onClick={() => onFeedbackSubmit(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {status === "rejected" && feedbackReason && (
          <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span className="font-medium text-gray-900">
              Feedback recorded —{" "}
            </span>
            {feedbackReason}
            <p className="mt-1 text-xs text-gray-400">{rejectedNote}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LeadCard;
