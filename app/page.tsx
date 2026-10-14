import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Workflow, Layers3, Check, Download } from "lucide-react";
import { PWAInstallButton } from "@/components/pwa-install-button";

export default function Home() {
  return (
    <main className="min-h-screen bg-white pb-[env(safe-area-inset-bottom)] text-zinc-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5 md:px-8">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight sm:text-xl">BluiSkill</Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <PWAInstallButton compact />
          <Link href="/login" className="hidden text-zinc-600 hover:text-black sm:inline">Log in</Link>
          <Link href="/signup" className="rounded-lg bg-black px-3 py-2.5 font-medium text-white hover:bg-zinc-800 sm:px-4">Get started <ArrowUpRight className="ml-1 inline" size={15}/></Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-5 sm:pb-20 sm:pt-16 md:grid-cols-[1fr_.9fr] md:gap-14 md:px-8 md:pb-28 md:pt-24">
        <div>
          <p className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs leading-5 text-zinc-600 sm:mb-6"><span className="size-1.5 shrink-0 rounded-full bg-black"/>Product planning and AI-assisted code security</p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-7xl">From idea to code, <span className="text-black">with confidence.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 sm:mt-6 sm:text-lg sm:leading-8">Plan what to build before you code. Review snippets for security risks. Keep your work in one focused workspace.</p>
          <div className="mt-7 flex flex-col items-stretch gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
            <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800">Start for free <ArrowUpRight className="ml-2 inline" size={16}/></Link>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium hover:bg-zinc-100">Open workspace</Link>
            <a href="https://github.com/daltonfds/Blui-skills/releases/latest/download/app-debug.apk" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100" aria-label="Download BluiSkill for Android">
              <Download size={16} /> Download Android APK
            </a>
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-500">Install the web app from your browser, or download the Android APK directly.</p>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500"><span><Check className="mr-1 inline text-black" size={15}/>10 starter credits</span><span><Check className="mr-1 inline text-black" size={15}/>Saved project roadmaps</span></div>
        </div>

        <div className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-xl shadow-zinc-200/60 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">Workspace / new-project</p><p className="mt-1 text-xs text-zinc-500">Roadmap preview</p></div><span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-black">Roadmap</span></div>
          <div className="mt-5 space-y-4">{[{n:"01",title:"Product requirements",sub:"Goals, users and core requirements"},{n:"02",title:"Architecture and data",sub:"Stack, schema and access rules"},{n:"03",title:"Implementation phases",sub:"Tasks and acceptance criteria"}].map(s=><div key={s.n} className="flex min-w-0 gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-xs text-black">{s.n}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{s.title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{s.sub}</p></div><span className="mt-3 size-2 shrink-0 rounded-full bg-black"/></div>)}</div>
          <div className="mt-5 rounded-xl border border-zinc-300 bg-white p-4"><div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck size={17} className="text-black"/>Security review</div><p className="mt-2 text-xs leading-5 text-zinc-600">Understand potential risks and generate a practical remediation prompt.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-5 sm:pb-20 md:px-8"><div className="grid gap-3 sm:gap-4 md:grid-cols-3">{[{Icon:Workflow,title:"Plan with clarity",desc:"Generate a product brief, architecture, delivery phases and an implementation prompt."},{Icon:ShieldCheck,title:"Spot security risks",desc:"Review code snippets and get findings explained in plain English."},{Icon:Layers3,title:"Keep work organised",desc:"Access saved projects, roadmaps and security reviews from your account."}].map(({Icon,title,desc})=><article key={title} className="rounded-xl border border-zinc-200 p-5 sm:p-6"><Icon className="mb-5 text-black" size={22}/><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-600">{desc}</p></article>)}</div><p className="mt-8 text-center text-xs leading-5 text-zinc-500">AI-assisted reviews can miss issues and do not replace specialist security tools or professional review.</p></section>
      <footer className="border-t border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 sm:px-5">© {new Date().getFullYear()} BluiSkill · Plan. Build. Secure.</footer>
    </main>
  );
}
