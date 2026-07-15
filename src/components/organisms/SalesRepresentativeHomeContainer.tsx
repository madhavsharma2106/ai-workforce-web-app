import { createClient } from "@/lib/supabase/server";
import { getLeadsAwaitingOutreach } from "@/lib/leads";
import { SalesRepresentativeHome } from "./SalesRepresentativeHome";

type Props = {
  employeeId: string;
  userId: string;
};

export async function SalesRepresentativeHomeContainer({
  employeeId,
  userId,
}: Props) {
  const supabase = await createClient();
  const leads = await getLeadsAwaitingOutreach(supabase, { userId });

  return (
    <SalesRepresentativeHome employeeId={employeeId} initialLeads={leads} />
  );
}
