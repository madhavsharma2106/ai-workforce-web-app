import type { FC } from "react";
import type { DraftSaveStatus, Lead } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmployeeAvatar,
  Eyebrow,
  Input,
  Text,
  Textarea,
} from "@/components/atoms";

export type { Lead };

type ApprovalStatus = "pending" | "approved" | "rejected";

type Props = {
  lead: Lead;
  status: ApprovalStatus;
  showDraft?: boolean;
  subjectText?: string;
  draftText?: string;
  isEditing?: boolean;
  feedbackActive: boolean;
  feedbackReason?: string;
  feedbackOptions?: string[];
  approveLabel?: string;
  rejectLabel?: string;
  approvedMessage?: string;
  rejectedNote?: string;
  approveDisabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onToggleEdit?: () => void;
  onSubjectChange?: (value: string) => void;
  onDraftChange?: (value: string) => void;
  onFeedbackSubmit: (reason: string) => void;
  onRevealEmail: () => void;
  isRevealingEmail: boolean;
  /** Only passed by Oliver's flow — renders a "Save to Drafts" button independent of send/approval. */
  onSaveDraft?: () => void;
  saveDraftDisabled?: boolean;
  draftSaveStatus?: DraftSaveStatus;
  draftSaveError?: string;
  /** Only passed by Oliver's flow, and only rendered when a reply is awaiting founder action (replyStatus is set). */
  replyStatus?: ApprovalStatus;
  replySnippet?: string;
  replyDraftText?: string;
  onApproveReply?: () => void;
  onRejectReply?: () => void;
  approveReplyDisabled?: boolean;
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

const withProtocol = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

function companySnapshot(lead: Lead): string | null {
  const parts = [
    lead.industry ? titleCase(lead.industry) : null,
    typeof lead.employeeCount === "number"
      ? `${lead.employeeCount.toLocaleString()} employees`
      : null,
    lead.location,
    lead.foundedYear ? `Founded ${lead.foundedYear}` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" • ") : null;
}

export const LeadCard: FC<Props> = ({
  lead,
  status,
  showDraft = true,
  subjectText,
  draftText,
  isEditing = false,
  feedbackActive,
  feedbackReason,
  feedbackOptions = DEFAULT_FEEDBACK_OPTIONS,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  approvedMessage = "Approved for sending.",
  rejectedNote = "I'll remember this for next time.",
  approveDisabled = false,
  onApprove,
  onReject,
  onToggleEdit,
  onSubjectChange,
  onDraftChange,
  onFeedbackSubmit,
  onRevealEmail,
  isRevealingEmail,
  onSaveDraft,
  saveDraftDisabled = false,
  draftSaveStatus = "not_saved",
  draftSaveError,
  replyStatus,
  replySnippet,
  replyDraftText,
  onApproveReply,
  onRejectReply,
  approveReplyDisabled = false,
}) => {
  const statusMeta = statusLabel[status];
  const emailLocked = Boolean(lead.personId) && !lead.emailRevealed;
  const snapshot = companySnapshot(lead);

  return (
    <Card as="article" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <EmployeeAvatar seed={lead.company} size="sm" />
            <p className="flex items-center gap-2 font-serif text-[19px] text-(--heading)">
              {lead.company}
              {lead.companyLinkedinUrl && (
                <a
                  href={withProtocol(lead.companyLinkedinUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-sans font-normal text-(--accent) underline decoration-dotted underline-offset-2 hover:text-(--accent-hover)"
                >
                  LinkedIn
                </a>
              )}
            </p>
          </div>
          {snapshot && (
            <Text size="sm" tone="subtle">
              {snapshot}
            </Text>
          )}
          {lead.website && (
            <p className="text-xs">
              <a
                href={withProtocol(lead.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--muted-faint) underline decoration-dotted underline-offset-2 hover:text-(--muted-faint-3)"
              >
                {lead.website}
              </a>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lead.segment && (
            <Badge tone="neutral" size="sm">
              {lead.segment}
            </Badge>
          )}
          <Badge tone={statusMeta.tone} size="sm">
            {statusMeta.label}
          </Badge>
        </div>
      </div>

      <Text size="sm" tone="subtle" className="mt-3.5">
        {lead.fit}
      </Text>

      {lead.whyNow && (
        <div className="mt-2 rounded-2xl bg-(--accent-soft) px-4 py-3">
          <Eyebrow>Why now</Eyebrow>
          <Text size="sm" className="mt-1 text-(--accent-soft-text)">
            {lead.whyNow}
          </Text>
        </div>
      )}

      <div className="mt-4">
        <Eyebrow>Decision maker</Eyebrow>
        <p className="mt-1 text-sm font-bold text-(--heading)">
          {lead.decisionMaker}
          {lead.contactLinkedinUrl && (
            <>
              {" "}
              <a
                href={withProtocol(lead.contactLinkedinUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-normal text-(--accent) underline decoration-dotted underline-offset-2 hover:text-(--accent-hover)"
              >
                LinkedIn
              </a>
            </>
          )}
        </p>
        <p className="mt-0.5 text-xs text-(--muted-faint)">
          {emailLocked ? (
            <button
              type="button"
              onClick={onRevealEmail}
              disabled={isRevealingEmail}
              className="text-(--accent) underline decoration-dotted underline-offset-2 transition hover:text-(--accent-hover) disabled:opacity-60"
            >
              {isRevealingEmail ? "Revealing…" : "Reveal email"}
            </button>
          ) : (
            lead.email
          )}
        </p>
      </div>

      {lead.researchSnippet && (
        <div className="mt-4 rounded-2xl bg-(--inset) px-4 py-3.5">
          <Eyebrow>Research</Eyebrow>
          <Text size="sm" tone="subtle" className="mt-1">
            {lead.researchSnippet}
          </Text>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {showDraft && (
          <div className="space-y-2 rounded-2xl bg-(--inset) p-3.5">
            <Eyebrow>Draft email</Eyebrow>
            {isEditing ? (
              <Input
                value={subjectText}
                placeholder="Subject"
                onChange={(event) => onSubjectChange?.(event.target.value)}
              />
            ) : (
              <p className="text-sm font-bold text-(--heading)">
                {subjectText}
              </p>
            )}
            {isEditing ? (
              <Textarea
                rows={5}
                value={draftText}
                onChange={(event) => onDraftChange?.(event.target.value)}
              />
            ) : (
              <Text
                size="sm"
                tone="subtle"
                className="whitespace-pre-wrap leading-relaxed"
              >
                {draftText}
              </Text>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text size="xs" className="text-(--muted-faint-2)">
            Source: {lead.sources}
          </Text>
          {status !== "approved" && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={onReject}>
                {rejectLabel}
              </Button>
              {onSaveDraft && (
                <Button
                  variant="secondary"
                  onClick={onSaveDraft}
                  disabled={saveDraftDisabled || draftSaveStatus === "saving"}
                >
                  {draftSaveStatus === "saving" ? "Saving…" : "Save to Drafts"}
                </Button>
              )}
              <Button onClick={onApprove} disabled={approveDisabled}>
                {approveLabel}
              </Button>
              {showDraft && (
                <Button variant="secondary" onClick={onToggleEdit}>
                  {isEditing ? "Done" : "Edit"}
                </Button>
              )}
            </div>
          )}
        </div>

        {onSaveDraft && draftSaveStatus === "saved" && (
          <Text size="xs" className="text-(--accent-hover)">
            Saved to your Drafts folder.
          </Text>
        )}
        {onSaveDraft && draftSaveStatus === "failed" && (
          <Text size="xs" className="text-red-600">
            {draftSaveError ?? "Couldn't save to Drafts."}{" "}
            <button type="button" className="underline" onClick={onSaveDraft}>
              Try again
            </button>
          </Text>
        )}

        {status === "approved" && (
          <div className="rounded-2xl bg-(--accent-soft) px-4 py-3 text-sm text-(--accent-soft-text)">
            {approvedMessage}
          </div>
        )}

        {replyStatus && (
          <div className="space-y-2 rounded-2xl bg-(--inset) p-3.5">
            <Eyebrow>They replied</Eyebrow>
            {replySnippet && (
              <Text size="sm" tone="subtle" className="italic">
                &ldquo;{replySnippet}&rdquo;
              </Text>
            )}
            <Eyebrow>Oliver&apos;s draft reply</Eyebrow>
            <Text size="sm" className="whitespace-pre-wrap leading-relaxed">
              {replyDraftText}
            </Text>
            {replyStatus === "pending" && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={onApproveReply}
                  disabled={approveReplyDisabled}
                >
                  Send reply
                </Button>
                <Button variant="secondary" onClick={onRejectReply}>
                  Reject
                </Button>
              </div>
            )}
            {replyStatus === "approved" && (
              <Text size="xs" className="text-(--accent-hover)">
                Sending your reply…
              </Text>
            )}
            {replyStatus === "rejected" && (
              <Text size="xs" tone="muted">
                Reply dismissed — I&apos;ll keep watching this thread.
              </Text>
            )}
          </div>
        )}

        {feedbackActive && (
          <div className="rounded-2xl bg-(--inset) p-3.5">
            <Text size="sm" weight="medium">
              Why was this not a good lead?
            </Text>
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
          <div className="rounded-2xl bg-(--inset) px-4 py-3 text-sm text-(--body)">
            <span className="font-bold text-(--heading)">
              Feedback recorded —{" "}
            </span>
            {feedbackReason}
            <p className="mt-1 text-xs text-(--muted-faint)">{rejectedNote}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
