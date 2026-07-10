import { createClient } from "@/lib/supabase/server";
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
  const [{ data: profile }] = await Promise.all([
    supabase
      .from("business_profiles")
      .select("business_name, contact_name, profile_md, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return (
    <AccountManagerHome
      employeeId={employeeId}
      businessName={profile?.business_name ?? null}
      contactName={profile?.contact_name ?? null}
      profileMd={profile?.profile_md ?? ""}
      updatedAt={profile?.updated_at ?? null}
    />
  );
}
