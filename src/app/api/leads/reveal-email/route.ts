import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { updateLeadEmail } from "@/lib/leads";
import { revealEmail } from "@/lib/integrations/apollo";
import { apiErrorResponse } from "@/lib/api/errors";

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const personId = String(body.personId ?? "");
  const leadId = String(body.leadId ?? "");

  if (!personId || !leadId) {
    return NextResponse.json(
      { error: "personId and leadId are required" },
      { status: 400 },
    );
  }

  try {
    const email = await revealEmail(personId);
    if (email) {
      await updateLeadEmail(supabase, { id: leadId, userId: user.id, email });
    }
    return NextResponse.json({ email });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
