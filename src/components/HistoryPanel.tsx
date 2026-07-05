import type { FC } from "react";
import type { Lead } from "@/lib/dummyLeads";

type ApprovalStatus = "pending" | "approved" | "rejected";

export type DayRecord = {
  id: number;
  label: string;
  dateLabel: string;
  standup: string;
  leads: Lead[];
  statuses: Record<number, ApprovalStatus>;
  feedback: Record<number, string>;
};

type Props = {
  days: DayRecord[];
};

const statusTone: Record<ApprovalStatus, string> = {
  approved: "bg-indigo-50 text-indigo-700",
  rejected: "bg-red-50 text-red-600",
  pending: "bg-gray-100 text-gray-500",
};

const HistoryPanel: FC<Props> = ({ days }) => {
  if (days.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No past days yet — Emma&apos;s history and experience will build up here
        after her first day on the job.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {[...days].reverse().map((day) => {
        const approved = day.leads.filter(
          (lead) => day.statuses[lead.id] === "approved",
        ).length;
        const rejected = day.leads.filter(
          (lead) => day.statuses[lead.id] === "rejected",
        ).length;

        return (
          <details
            key={day.id}
            className="group rounded-lg border border-gray-200 p-4"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {day.label}{" "}
                  <span className="font-normal text-gray-400">
                    · {day.dateLabel}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {approved} approved · {rejected} rejected
                </p>
              </div>
              <span className="text-xs font-medium text-indigo-600 group-open:hidden">
                Show details
              </span>
              <span className="hidden text-xs font-medium text-gray-400 group-open:inline">
                Hide details
              </span>
            </summary>

            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <p className="text-sm leading-6 text-gray-600">{day.standup}</p>
              <div className="space-y-2">
                {day.leads.map((lead) => {
                  const status = day.statuses[lead.id];
                  const reason = day.feedback[lead.id];
                  return (
                    <div
                      key={lead.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {lead.company}
                        </span>
                        {reason && (
                          <span className="ml-2 text-xs text-gray-400">
                            — {reason}
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[status]}`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
};

export default HistoryPanel;
