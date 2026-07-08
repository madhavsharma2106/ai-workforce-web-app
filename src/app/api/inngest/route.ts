import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { runEmployeeGraph } from "@/lib/inngest/functions/runEmployeeGraph";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runEmployeeGraph],
});
