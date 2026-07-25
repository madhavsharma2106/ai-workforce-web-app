import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { AppHeader } from "@/components/organisms";
import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  return (
    <div className="min-h-screen bg-background text-(--body-strong)">
      <PostHogIdentify userId={user.id} email={user.email ?? null} />
      <AppHeader userEmail={user.email ?? null} />
      {children}
    </div>
  );
}
