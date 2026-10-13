import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { WorkspaceHeader } from "@/components/workspace-header";
import { AdSlot } from "@/components/ad-slot";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black">
      <WorkspaceHeader />
      <AdSlot />
      <div className="mx-auto min-h-[calc(100vh-108px)] max-w-[1800px] md:flex">
        <Sidebar email={user.email || ""} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
