import { createClient } from "@/lib/supabase/server";

export default async function DashboardSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <section className="mx-auto w-full max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Account</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Settings</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">Review your account details and workspace preferences.</p>
      <div className="mt-7 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
        <div className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Account email</h2>
          <p className="mt-2 break-all text-sm text-zinc-600">{user?.email || "No email available"}</p>
          <p className="mt-1 text-xs text-zinc-500">Email changes and password recovery are managed through your authentication provider.</p>
        </div>
        <div className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Workspace preferences</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Your language and last selected workspace are stored in this browser. Use the header to change language or switch between Developer Studio and Academic Workspace.</p>
        </div>
        <div className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Support</h2>
          <p className="mt-2 text-sm text-zinc-600"><a className="underline underline-offset-4 hover:text-black" href="mailto:support@bluiskill.com">support@bluiskill.com</a></p>
        </div>
      </div>
    </section>
  );
}
