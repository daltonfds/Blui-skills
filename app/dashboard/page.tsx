"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clipboard, LoaderCircle, Sparkles, Plus, ArrowRight, Layers3, Smartphone } from "lucide-react";

type RoadmapPhase = { title: string; goal: string; tasks: string[]; acceptanceCriteria: string[] };
type RoadmapResult = { projectName: string; prd: string; architecture: string; roadmap: RoadmapPhase[]; masterPrompt: string };
type ResultTab = "architecture" | "roadmap" | "prompt";
type MobileStep = "input" | "result";

const stacks = [
  { value: "Next.js + Supabase", label: "Next.js + Supabase" },
  { value: "Node.js + PostgreSQL", label: "Node.js + PostgreSQL" },
  { value: "React + Firebase", label: "React + Firebase" },
  { value: "Custom", label: "Custom stack" },
];
const ideaChips = [
  { label: "SaaS B2B", text: "A B2B SaaS for teams to manage customers, workflows, roles and subscription billing." },
  { label: "Marketplace", text: "A marketplace connecting buyers and sellers, with product listings, checkout, order tracking and seller dashboards." },
  { label: "App Mobile", text: "A mobile-first app with secure authentication, user profiles, push notifications and a clean responsive experience." },
  { label: "Micro-SaaS", text: "A focused micro-SaaS that solves one specific problem with a simple onboarding flow, a core feature and paid plans." },
];

export default function DashboardPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [stack, setStack] = useState(stacks[0].value);
  const [customStack, setCustomStack] = useState("");
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("architecture");
  const [mobileStep, setMobileStep] = useState<MobileStep>("input");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, stack: stack === "Custom" ? customStack.trim() : stack }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not generate the plan.");
      setResult(body.result as RoadmapResult);
      setActiveTab("architecture");
      setMobileStep("result");
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

  function chooseChip(text: string) {
    setIdea((current) => current.trim() ? current.trimEnd() + "\n\n" + text : text);
  }

  const tabButton = (tab: ResultTab, label: string) => (
    <button key={tab} type="button" onClick={() => { setActiveTab(tab); setCopied(false); }}
      className={"whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition " + (activeTab === tab ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900")}
      role="tab" aria-selected={activeTab === tab}>{label}</button>
  );

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Architect</h1>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] xl:gap-6">
        <section className={(mobileStep === "result" && result ? "hidden lg:block " : "") + "min-w-0 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 sm:p-6"}>
          <div className="mb-5"><h2 className="text-lg font-semibold text-zinc-950">Describe your product</h2></div>

          <form onSubmit={generate}>
            <textarea id="app-idea" required minLength={20} maxLength={12000} value={idea}
              onChange={(event) => setIdea(event.target.value)} rows={7}
              placeholder="Describe your product..."
              className="mt-2 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 sm:min-h-44" />
            <div className="mt-3 flex flex-wrap gap-2">
              {ideaChips.map((chip) => (
                <button key={chip.label} type="button" onClick={() => chooseChip(chip.text)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950">
                  {chip.label}
                </button>
              ))}
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-zinc-900">Development stack</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stacks.map((option) => (
                  <button key={option.value} type="button" onClick={() => setStack(option.value)}
                    aria-pressed={stack === option.value}
                    className={"flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition " + (stack === option.value ? "border-zinc-900 bg-zinc-100 text-zinc-950 ring-1 ring-zinc-900/10" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50")}>
                    <span>{option.label}</span>
                    {stack === option.value && <Check size={15} className="ml-auto shrink-0 text-zinc-700" />}
                  </button>
                ))}
              </div>
              {stack === "Custom" && <input aria-label="Custom development stack" value={customStack} onChange={(event) => setCustomStack(event.target.value)} maxLength={240} placeholder="e.g. Next.js + PostgreSQL + Redis" className="mt-3 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10" />}
            </fieldset>

            {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-6 text-red-700">{error}</p>}

            <button type="submit" disabled={busy || idea.trim().length < 20 || (stack === "Custom" && customStack.trim().length < 3)}
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? <><LoaderCircle size={17} className="mr-2 animate-spin" />Generating…</> : "Generate"}
            </button>
          </form>
        </section>

        <section className={(mobileStep === "input" ? "hidden lg:block " : "") + "min-w-0 rounded-2xl border border-zinc-200/80 bg-white shadow-sm"}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">02 / Live output</p>
              <h2 className="mt-1 truncate text-lg font-semibold text-zinc-950">{result?.projectName || "Your project plan"}</h2>
            </div>
            {result ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Check size={13} /> Saved</span> : <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500">Preview</span>}
          </div>

          {!result && !busy && (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[540px]">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500"><Layers3 size={22} /></div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">Your plan will appear here</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Describe your product, select a stack and generate a structured PRD, architecture, roadmap and ready-to-use coding prompt.</p>
              <div className="mt-6 grid w-full max-w-md gap-2 text-left sm:grid-cols-2">
                {["Product requirements", "Technical architecture", "Implementation roadmap", "Master prompt"].map((item, index) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/70 px-3 py-2.5 text-xs text-zinc-600">
                    <span className="text-zinc-400">0{index + 1}</span>{item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {busy && (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12 text-center" role="status">
              <LoaderCircle size={26} className="animate-spin text-zinc-700" />
              <h3 className="mt-4 font-semibold text-zinc-900">Structuring your product plan</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Analysing requirements, architecture and delivery phases. Keep this workspace open.</p>
            </div>
          )}

          {result && (
            <>
              <div className="border-b border-zinc-200 px-2 sm:px-4">
                <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Generated plan sections">
                  {tabButton("architecture", "PRD / Architecture")}
                  {tabButton("roadmap", "Roadmap")}
                  {tabButton("prompt", "Master Prompt")}
                </div>
              </div>

              {activeTab === "architecture" && (
                <div className="grid gap-4 p-4 sm:p-5">
                  <article className="min-w-0 rounded-lg border border-zinc-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-zinc-950">Product requirements (PRD)</h3><button type="button" onClick={() => void copyText(result.prd)} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"><Clipboard size={13} /> Copy</button></div>
                    <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-zinc-700">{result.prd}</pre>
                  </article>
                  <article className="min-w-0 rounded-lg border border-zinc-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-zinc-950">Technical architecture</h3><button type="button" onClick={() => void copyText(result.architecture)} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"><Clipboard size={13} /> Copy</button></div>
                    <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-zinc-700">{result.architecture}</pre>
                  </article>
                </div>
              )}

              {activeTab === "roadmap" && (
                <div className="space-y-3 p-4 sm:p-5">
                  {(result.roadmap || []).map((phase, index) => (
                    <details key={String(index) + phase.title} open={index === 0} className="group rounded-lg border border-zinc-200">
                      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-700">{String(index + 1).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1"><span className="block font-semibold text-zinc-950">{phase.title}</span><span className="mt-1 block text-sm leading-6 text-zinc-500">{phase.goal}</span></span>
                        <ArrowRight size={15} className="shrink-0 text-zinc-400 transition group-open:rotate-90" />
                      </summary>
                      <div className="border-t border-zinc-100 px-4 pb-5 pt-4 sm:pl-[4.25rem]">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tasks</h4>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">{(phase.tasks || []).map((task, taskIndex) => <li key={taskIndex}>{task}</li>)}</ul>
                        <h4 className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Acceptance criteria</h4>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">{(phase.acceptanceCriteria || []).map((criterion, criterionIndex) => <li key={criterionIndex}>{criterion}</li>)}</ul>
                      </div>
                    </details>
                  ))}
                </div>
              )}

              {activeTab === "prompt" && (
                <div className="p-3 sm:p-5">
                  <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#09090B] text-zinc-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-5">
                      <div><p className="text-sm font-semibold">Master Prompt</p><p className="mt-1 text-xs text-zinc-400">Cursor · Windsurf · Claude Code</p></div>
                      <button type="button" onClick={() => void copyText(result.masterPrompt)}
                        className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-700">
                        {copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied to clipboard!" : "Copy Master Prompt"}
                      </button>
                    </div>
                    <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-zinc-200 sm:p-5">{result.masterPrompt}</pre>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">Copy the prompt and paste it into your coding assistant to begin implementation.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-zinc-200 bg-white/95 p-2 backdrop-blur lg:hidden" aria-label="Workspace steps">
        <button type="button" onClick={() => setMobileStep("input")} className={"flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium " + (mobileStep === "input" ? "bg-zinc-100 text-zinc-950" : "text-zinc-500")}>
          <Layers3 size={16} /> Input
        </button>
        <button type="button" onClick={() => setMobileStep("result")} disabled={!result && !busy} className={"flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium " + (mobileStep === "result" ? "bg-zinc-100 text-zinc-700" : "text-zinc-500") + " disabled:opacity-40"}>
          <Smartphone size={16} /> Result {result ? <Check size={14} /> : null}
        </button>
      </nav>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
