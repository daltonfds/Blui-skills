"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Clipboard, LoaderCircle, Sparkles } from "lucide-react";

type RoadmapPhase = {
  title: string;
  goal: string;
  tasks: string[];
  acceptanceCriteria: string[];
};

type RoadmapResult = {
  projectName: string;
  prd: string;
  architecture: string;
  roadmap: RoadmapPhase[];
  masterPrompt: string;
};

type ResultTab = "architecture" | "roadmap" | "prompt";

const stacks = [
  "Next.js + Supabase",
  "React + Firebase",
  "Node.js + PostgreSQL",
  "Custom",
];

export default function DashboardPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [stack, setStack] = useState(stacks[0]);
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("architecture");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, stack }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Could not generate the roadmap.");
      }

      setResult(body.result as RoadmapResult);
      setActiveTab("architecture");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Clipboard access was blocked. Select the text and copy it manually.");
    }
  }

  const tabButton = (tab: ResultTab, label: string) => (
    <button
      key={tab}
      type="button"
      onClick={() => { setActiveTab(tab); setCopied(false); }}
      className={`border-b-2 px-3 py-3 text-sm font-medium transition ${activeTab === tab
        ? "border-blue-600 text-zinc-950"
        : "border-transparent text-zinc-500 hover:text-zinc-900"}`}
      role="tab"
      aria-selected={activeTab === tab}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        Blui Architect
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
        Create roadmap
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
        Turn your app idea into a clear technical plan, a phased roadmap, and a master prompt for your coding AI.
      </p>

      <form onSubmit={generate} className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 sm:p-7">
        <label htmlFor="app-idea" className="block text-sm font-semibold text-zinc-900">
          What is your app idea?
        </label>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Explain the problem, who the app is for, and the main features you want to build.
        </p>
        <textarea
          id="app-idea"
          required
          minLength={20}
          maxLength={12000}
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          rows={7}
          placeholder="Describe the problem, users and core features…"
          className="mt-4 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
        />
        <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label htmlFor="tech-stack" className="block text-sm font-semibold text-zinc-900">
            Target technology stack
            <span className="relative mt-2 block">
              <select
                id="tech-stack"
                value={stack}
                onChange={(event) => setStack(event.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm font-normal text-zinc-900 outline-none focus:border-blue-600"
              >
                {stacks.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            </span>
          </label>
          <button
            type="submit"
            disabled={busy || idea.trim().length < 20}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? <><LoaderCircle size={16} className="mr-2 animate-spin" />Generating…</>
              : <><Sparkles size={16} className="mr-2" />Generate architecture & roadmap <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-xs">1 credit</span></>}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </p>
        )}
        <p className="mt-4 text-xs text-zinc-500">
          Your roadmap is saved to My Projects when generation succeeds.
        </p>
      </form>

      {busy && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600" role="status">
          <LoaderCircle size={18} className="animate-spin text-blue-600" />
          Analysing your idea and structuring the implementation plan…
        </div>
      )}

      {result && (
        <section className="mt-9" aria-label="Generated roadmap">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Your project plan</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{result.projectName || "Your roadmap"}</h2>
            </div>
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500">Saved to My Projects</span>
          </div>

          <div className="mt-5 border-b border-zinc-200">
            <div className="-mb-px flex flex-wrap gap-1" role="tablist" aria-label="Roadmap result sections">
              {tabButton("architecture", "PRD & Architecture")}
              {tabButton("roadmap", "Step-by-step roadmap")}
              {tabButton("prompt", "Master Prompt")}
            </div>
          </div>

          {activeTab === "architecture" && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
                <h3 className="font-semibold text-zinc-950">Product requirements (PRD)</h3>
                <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-700">{result.prd}</pre>
                <button type="button" onClick={() => void copyText(result.prd)} className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-black">
                  {copied ? <Check size={14} /> : <Clipboard size={14} />} Copy PRD
                </button>
              </article>
              <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
                <h3 className="font-semibold text-zinc-950">Technical architecture</h3>
                <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-700">{result.architecture}</pre>
                <button type="button" onClick={() => void copyText(result.architecture)} className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-black">
                  {copied ? <Check size={14} /> : <Clipboard size={14} />} Copy architecture
                </button>
              </article>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="mt-4 space-y-3">
              {(result.roadmap || []).map((phase, index) => (
                <details key={`${index}-${phase.title}`} open={index === 0} className="group rounded-xl border border-zinc-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-700">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-zinc-950">{phase.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-zinc-500">{phase.goal}</span>
                    </span>
                    <ChevronDown size={16} className="shrink-0 text-zinc-500 transition group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-zinc-100 px-5 pb-5 pt-4 sm:ml-12">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tasks</h4>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
                      {phase.tasks.map((task, taskIndex) => <li key={taskIndex}>{task}</li>)}
                    </ul>
                    <h4 className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Acceptance criteria</h4>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
                      {phase.acceptanceCriteria.map((criterion, criterionIndex) => <li key={criterionIndex}>{criterion}</li>)}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          )}

          {activeTab === "prompt" && (
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950">Master Prompt</h3>
                  <p className="mt-1 text-xs text-zinc-500">Ready to paste into Cursor, Windsurf, Lovable, v0 or Claude Code.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(result.masterPrompt)}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800"
                >
                  {copied ? <Check size={14} /> : <Clipboard size={14} />}
                  {copied ? "Copied!" : "Copy Master Prompt"}
                </button>
              </div>
              <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap break-words bg-zinc-50 p-5 font-mono text-xs leading-6 text-zinc-800 sm:p-6">{result.masterPrompt}</pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
