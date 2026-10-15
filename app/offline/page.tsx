import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">BluiSkill</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Estás offline</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">This page could not load without an internet connection. Reconnect and try again. For your security, account data is not stored offline.</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white">Try again</Link>
      </section>
    </main>
  );
}
