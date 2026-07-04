import type { FC } from "react";

export type Lead = {
  id: number;
  company: string;
  website: string;
  fit: string;
  decisionMaker: string;
  email: string;
  draft: string;
  sources: string;
};

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
};

const statusLabel: Record<ApprovalStatus, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", tone: "bg-orange-100 text-orange-800" },
  rejected: { label: "Rejected", tone: "bg-rose-100 text-rose-800" },
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
}) => {
  const statusMeta = statusLabel[status];

  return (
    <article className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-lg font-semibold text-orange-900">
              E
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                {lead.company}
              </p>
              <p className="text-sm text-slate-500">{lead.website}</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-900">Decision maker</p>
              <p>{lead.decisionMaker}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Email</p>
              <p>{lead.email}</p>
            </div>
          </div>
          <div className="mt-3 rounded-3xl bg-[#f9f5ef] p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              Why this company is a good fit
            </p>
            <p className="mt-2">{lead.fit}</p>
          </div>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${statusMeta.tone}`}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.08em]">
            {statusMeta.label}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="space-y-2 rounded-3xl bg-[#f9f5ef] p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Draft email</p>
          {isEditing ? (
            <textarea
              className="w-full rounded-2xl border border-amber-100 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-orange-300"
              rows={5}
              value={draftText}
              onChange={(event) => onDraftChange(event.target.value)}
            />
          ) : (
            <p className="whitespace-pre-wrap">{draftText}</p>
          )}
          <p className="text-xs text-slate-500">Sources: {lead.sources}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-2xl bg-[#ea7317] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d45f0a]"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onToggleEdit}
            className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200"
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>

        {status === "approved" && (
          <div className="rounded-3xl bg-orange-50 p-4 text-sm text-orange-800">
            Approved for sending.
          </div>
        )}

        {feedbackActive && (
          <div className="rounded-3xl border border-amber-100 bg-[#f9f5ef] p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">
              Why was this not a good lead?
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {feedbackOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onFeedbackSubmit(option)}
                  className="rounded-2xl border border-amber-100 bg-white px-3 py-2 text-left text-sm text-slate-900 transition hover:border-orange-200"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === "rejected" && feedbackReason && (
          <div className="rounded-3xl bg-orange-50 p-4 text-sm text-orange-800">
            <p className="font-semibold text-slate-900">Feedback recorded</p>
            <p>{feedbackReason}</p>
            <p className="mt-2 text-xs text-slate-500">
              Emma will remember this for tomorrow.
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

export default LeadCard;
