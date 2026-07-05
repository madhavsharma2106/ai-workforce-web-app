import type { FC } from "react";
import type { Lead } from "@/lib/dummyLeads";

export type { Lead };

type ApprovalStatus = "pending" | "approved" | "rejected";

type Props = {
  lead: Lead;
  status: ApprovalStatus;
  draftText: string;
  isEditing: boolean;
  feedbackActive: boolean;
  feedbackReason?: string;
  onApprove: () => void;
  onReject: () => void;
  onToggleEdit: () => void;
  onDraftChange: (value: string) => void;
  onFeedbackSubmit: (reason: string) => void;
  onRevealEmail: () => void;
  isRevealingEmail: boolean;
};

const statusLabel: Record<ApprovalStatus, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-gray-100 text-gray-600" },
  approved: { label: "Approved", tone: "bg-indigo-50 text-indigo-700" },
  rejected: { label: "Rejected", tone: "bg-red-50 text-red-600" },
};

const feedbackOptions = [
  "Too small",
  "Wrong industry",
  "Already contacted",
  "Not enough budget",
  "Other",
];

const LeadCard: FC<Props> = ({
  lead,
  status,
  draftText,
  isEditing,
  feedbackActive,
  feedbackReason,
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

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-gray-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-900 text-sm font-medium text-white">
              {lead.company.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {lead.company}
              </p>
              <p className="font-mono text-xs text-gray-400">
                {lead.website}
              </p>
            </div>
          </div>
          <div className="grid gap-x-6 gap-y-1 text-sm text-gray-500 sm:grid-cols-2">
            <div>
              <span className="text-gray-400">Decision maker </span>
              <span className="text-gray-700">{lead.decisionMaker}</span>
            </div>
            <div>
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
            </div>
          </div>
          <div className="rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
            <span className="font-medium text-gray-900">Fit — </span>
            {lead.fit}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.tone}`}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-2 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Draft email
          </p>
          {isEditing ? (
            <textarea
              className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400"
              rows={5}
              value={draftText}
              onChange={(event) => onDraftChange(event.target.value)}
            />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{draftText}</p>
          )}
          <p className="text-xs text-gray-400">Sources: {lead.sources}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-md bg-gray-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-md border border-gray-200 px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onToggleEdit}
            className="rounded-md border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>

        {status === "approved" && (
          <div className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            Approved for sending.
          </div>
        )}

        {feedbackActive && (
          <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
            <p className="font-medium text-gray-900">
              Why was this not a good lead?
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {feedbackOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onFeedbackSubmit(option)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-left text-sm text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  {option}
                </button>
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
            <p className="mt-1 text-xs text-gray-400">
              Emma will remember this for tomorrow.
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

export default LeadCard;
