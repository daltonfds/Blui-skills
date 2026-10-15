"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, FileSearch, FileText, LibraryBig, Search } from "lucide-react";

type Objective = "research" | "paper" | "study";
const objectives: Array<{ value: Objective; label: string; description: string }> = [
  { value: "research", label: "Deep Research", description: "Search the web, compare evidence and collect verifiable sources." },
  { value: "paper", label: "Academic Writing", description: "Build a structured academic paper from a topic and supplied sources." },
  { value: "study", label: "Study & Revision", description: "Create summaries, practice questions and revision cards." },
];

export default function AcademicHome() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [objective, setObjective] = useState<Objective>("research");
  const [language, setLanguage] = useState("Auto-detect");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = prompt.trim();
    if (value.length < 8) {
      setError("Enter a topic or question with at least 8 characters.");
      return;
    }
    const target = objective === "research" ? "/dashboard/academic/research" : objective === "paper" ? "/dashboard/academic/paper" : "/dashboard/academic/study";
    const params = new URLSearchParams({ prompt: value, language });
    router.push(target + "?" + params.toString());
  }

  return <div className="mx-auto w-full max-w-4xl pb-10 sm:pb-14">
    <header className="pt-3 text-center sm:pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">BluiSkill / Academic Workspace</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">What are you working on?</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">Research, write and study in one workspace. Start with a question and choose what you want to do with it.</p>
    </header>

    <form onSubmit={submit} className="mt-7 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:mt-9 sm:p-5">
      <label htmlFor="academic-prompt" className="sr-only">Topic or question</label>
      <textarea id="academic-prompt" value={prompt} onChange={event => { setPrompt(event.target.value); setError(""); }} rows={4} maxLength={4000} placeholder="Write a question, describe a topic or explain what you need to find out…" className="min-h-32 w-full resize-y rounded-xl border-0 bg-transparent px-2 py-3 text-base leading-7 text-zinc-950 outline-none placeholder:text-zinc-400 focus:ring-0 sm:min-h-36 sm:px-3" />
      <div className="mt-2 grid gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(160px,auto)] sm:items-end">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-600">Goal
            <select value={objective} onChange={event => setObjective(event.target.value as Objective)} className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white">
              {objectives.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-600">Output language
            <select value={language} onChange={event => setLanguage(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white">
              <option>Auto-detect</option><option>English</option><option>Português</option><option>Español</option><option>Français</option>
            </select>
          </label>
        </div>
        <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"><Search size={16}/>Continue<ArrowUpRight size={16}/></button>
      </div>
      {error && <p role="alert" className="px-2 pt-2 text-sm text-red-700">{error}</p>}
      <p className="px-2 pb-1 pt-3 text-xs leading-5 text-zinc-500">{objectives.find(item => item.value === objective)?.description} Output language is detected automatically by default.</p>
    </form>

    <section className="mt-8 sm:mt-10" aria-label="Academic tools">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900">Explore your workspace</h2><span className="text-xs text-zinc-500">Your academic tools</span></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/academic/research" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-blue-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><FileSearch size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Deep Research</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Investigate with web sources</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
        <Link href="/dashboard/academic/paper" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-blue-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><FileText size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Academic Writing</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Build a structured document</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
        <Link href="/dashboard/academic/study" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-blue-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><BookOpen size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Study & Revision</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Summarize and test your knowledge</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
        <Link href="/dashboard/academic/library" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-blue-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><LibraryBig size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Academic Library</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Return to saved materials</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
      </div>
    </section>
    <p className="mt-6 text-center text-xs leading-5 text-zinc-500">Always verify sources, facts and your institution’s requirements before submitting academic work.</p>
  </div>;
}
