import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { AppHeader } from "@/components/organisms";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  return (
    <div className="min-h-screen bg-background text-(--body-strong)">
      <AppHeader userEmail={user.email ?? null} />
      {children}
    </div>
  );
}
