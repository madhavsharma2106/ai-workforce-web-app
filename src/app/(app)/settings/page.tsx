import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { SettingsHomeContainer } from "@/components/organisms";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  return <SettingsHomeContainer userId={user.id} />;
}
