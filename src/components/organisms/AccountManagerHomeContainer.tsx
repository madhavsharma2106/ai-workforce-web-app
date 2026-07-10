import { createClient } from "@/lib/supabase/server";
import { listEmployees } from "@/lib/employees";
import AccountManagerHome from "./AccountManagerHome";

type Props = {
  employeeId: string;
  userId: string;
};

export default async function AccountManagerHomeContainer({
  employeeId,
  userId,
}: Props) {
  const supabase = await createClient();
  const [{ data: profile }, otherEmployees] = await Promise.all([
    supabase
      .from("business_profiles")
      .select("business_name, contact_name, profile_md, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    listEmployees(supabase, userId),
  ]);

  return (
    <AccountManagerHome
      employeeId={employeeId}
      businessName={profile?.business_name ?? null}
      contactName={profile?.contact_name ?? null}
      profileMd={profile?.profile_md ?? ""}
      updatedAt={profile?.updated_at ?? null}
      otherEmployees={otherEmployees.filter((e) => e.id !== employeeId)}
    />
  );
}
