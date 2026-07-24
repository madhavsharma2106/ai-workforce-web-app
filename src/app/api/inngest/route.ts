import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { runEmployeeGraph } from "@/lib/inngest/functions/runEmployeeGraph";
import { draftOutreachOnApproval } from "@/lib/inngest/functions/draftOutreachOnApproval";
import { sendOutreachOnApproval } from "@/lib/inngest/functions/sendOutreachOnApproval";
import { saveDraftToMailbox } from "@/lib/inngest/functions/saveDraftToMailbox";
import { pollForReplies } from "@/lib/inngest/functions/pollForReplies";
import { draftReplyOnReceipt } from "@/lib/inngest/functions/draftReplyOnReceipt";
import { sendReplyOnApproval } from "@/lib/inngest/functions/sendReplyOnApproval";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runEmployeeGraph,
    draftOutreachOnApproval,
    sendOutreachOnApproval,
    saveDraftToMailbox,
    pollForReplies,
    draftReplyOnReceipt,
    sendReplyOnApproval,
  ],
});
