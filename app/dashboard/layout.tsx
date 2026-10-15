import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { WorkspaceHeader } from "@/components/workspace-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] pb-[env(safe-area-inset-bottom)] text-black">
      <WorkspaceHeader />
      <div className="border-b border-zinc-200 bg-white px-3 py-2 sm:px-6">
        <div className="mx-auto flex min-h-7 max-w-[1600px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 text-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">Advertisement · Reserved space</span>
        </div>
      </div>
      <div className="mx-auto min-h-[calc(100dvh-145px)] max-w-[1800px] md:flex">
        <Sidebar email={user?.email || ""} />
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
