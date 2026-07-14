import { createClient } from "@/lib/supabase/server";
import { getLeadsAwaitingOutreach } from "@/lib/leads";
import { getEmployeeById, getAccountManager } from "@/lib/employees";
import SalesRepresentativeHome from "./SalesRepresentativeHome";

type Props = {
  employeeId: string;
  userId: string;
};

export default async function SalesRepresentativeHomeContainer({ employeeId, userId }: Props) {
  const supabase = await createClient();
  const [leads, self, accountManager] = await Promise.all([
    getLeadsAwaitingOutreach(supabase, { userId }),
    getEmployeeById(supabase, employeeId),
    getAccountManager(supabase, userId),
  ]);

  return (
    <SalesRepresentativeHome
      employeeId={employeeId}
      initialLeads={leads}
      initialInstructionsMd={self?.instructions_md ?? null}
      accountManagerId={accountManager?.id ?? null}
    />
  );
}
