import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { WorkspaceHeader } from "@/components/workspace-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] pb-[env(safe-area-inset-bottom)] text-black">
      <WorkspaceHeader />
      <div className="mx-auto min-h-[calc(100dvh-80px)] max-w-[1800px] md:flex">
        <Sidebar email={user?.email || ""} />
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
