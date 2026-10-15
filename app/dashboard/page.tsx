"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, Clipboard, Download, Ellipsis, FileText, LoaderCircle, Plus, X } from "lucide-react";
import { RoadmapDiagram } from "@/components/roadmap-diagram";
import { createClient } from "@/lib/supabase/client";

type Phase = { title: string; goal: string; tasks: string[]; acceptanceCriteria: string[] };
type Result = { projectName: string; prd: string; architecture: string; roadmap: Phase[]; masterPrompt: string; mermaid?: string };
type Tab = "prd" | "architecture" | "roadmap" | "prompt";
type Message = { id: string; role: "user" | "assistant"; content: string; result?: Result };
const tabItems: { id: Tab; label: string }[] = [{ id: "prd", label: "PRD" }, { id: "architecture", label: "Architecture" }, { id: "roadmap", label: "Roadmap" }, { id: "prompt", label: "Master prompt" }];
const starters = [
  ["Plan a product", "Turn an idea into a product specification and launch roadmap."],
  ["Design an architecture", "Map the stack, database, APIs and deployment."],
  ["Write a master prompt", "Prepare a build-ready prompt for your coding assistant."],
];

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [stack, setStack] = useState("Next.js + Supabase");
  const [customStack, setCustomStack] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [tab, setTab] = useState<Tab>("prd");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestReady, setGuestReady] = useState(false);
  const [guestDemoUsed, setGuestDemoUsed] = useState(false);
  const [accessLabel, setAccessLabel] = useState("");
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      const guest = !user;
      setIsGuest(guest);
      setGuestDemoUsed(guest && window.localStorage.getItem("bluiskill-guest-demo-used-v1") === "1");
      if (user) {
        const { data: profile } = await sb.from("profiles").select("plan_type,pass_expires_at,credits").eq("id", user.id).maybeSingle();
        if (mounted && profile) {
          const expiry = profile.pass_expires_at ? new Date(profile.pass_expires_at).getTime() : 0;
          const active = ["daily_pass", "weekly_pass", "monthly_pass"].includes(profile.plan_type) && expiry > Date.now();
          setHasPaidAccess(active || Number(profile.credits || 0) > 0);
          setAccessLabel(active ? "Active pass · expires on " + new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" }).format(new Date(expiry)) : String(profile.credits) + " credit(s) available");
        }
      }
      setGuestReady(true);
    }).catch(() => {
      if (!mounted) return;
      setIsGuest(true);
      setGuestDemoUsed(window.localStorage.getItem("bluiskill-guest-demo-used-v1") === "1");
      setGuestReady(true);
    });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (searchParams.get("gate")) setPaywallOpen(true);
  }, [searchParams]);
  useEffect(() => {
    const idea = searchParams.get("idea");
    const savedStack = searchParams.get("stack");
    if (idea) setInput(idea.slice(0, 12000));
    if (savedStack) setStack(savedStack.slice(0, 120));
  }, [searchParams]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  function reset() { setInput(""); setMessages([]); setResult(null); setError(""); setOpen(false); inputRef.current?.focus(); }
  async function send(value?: string) {
    const prompt = (value ?? input).trim();
    if (!prompt || busy) return;
    if (!guestReady) return;
    if (isGuest && (guestDemoUsed || window.localStorage.getItem("bluiskill-guest-demo-used-v1") === "1")) {
      setPaywallOpen(true);
      return;
    }
    setInput(""); setError(""); setMessages((m) => [...m, { id: String(Date.now()), role: "user", content: prompt }]); setBusy(true);
    try {
      const response = await fetch("/api/generate-roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: prompt, stack: stack === "Custom" ? `Custom technology stack:\n${customStack.trim() || "Choose the most suitable stack and explain the choice."}` : stack, visualStyle: "Minimal monochrome", deviceSupport: "Desktop + Mobile" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not generate your project plan.");
      const generated = data.result as Result;
      if (isGuest) {
        window.localStorage.setItem("bluiskill-guest-demo-used-v1", "1");
        setGuestDemoUsed(true);
      }
      setResult(generated); setTab("prd");
      setMessages((m) => [...m, { id: String(Date.now() + 1), role: "assistant", content: "Your project plan is ready. Open the structured results to review each section.", result: generated }]);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(message); setMessages((m) => [...m, { id: String(Date.now() + 1), role: "assistant", content: message }]);
    } finally { setBusy(false); }
  }
  function contentForTab() {
    if (!result) return "";
    if (tab === "prd") return result.prd;
    if (tab === "architecture") return result.architecture;
    if (tab === "prompt") return result.masterPrompt;
    return result.roadmap.map((p, i) => `PHASE ${i + 1}: ${p.title}\nGoal: ${p.goal}\n\nTasks:\n${p.tasks.map((x) => "- " + x).join("\n")}\n\nAcceptance criteria:\n${p.acceptanceCriteria.map((x) => "- " + x).join("\n")}`).join("\n\n────────────────────\n\n");
  }
  async function copy() { try { await navigator.clipboard.writeText(contentForTab()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setError("Clipboard is unavailable. Select the text and copy it manually."); } }
  function downloadMarkdown() {
    if (!result) return;
    const content = contentForTab();
    const filename = (result.projectName || "bluiskill-output").replace(/[^a-z0-9-_]+/gi, "-").slice(0, 80) || "bluiskill-output";
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename + "-" + tab + ".md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="relative mx-auto flex min-h-[calc(100dvh-190px)] w-full max-w-4xl flex-col pb-36">
    <div className="mb-5 flex items-start justify-between gap-3 sm:mb-8">
      <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Developer Studio</p><h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">What are we building?</h1><p className="mt-2 max-w-xl text-[13px] leading-5 text-zinc-500 sm:text-sm sm:leading-6">Describe your idea. BluiSkill will organise the specification, architecture and delivery plan.</p>{isGuest ? <p className="mt-3 inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600">{guestDemoUsed ? "Free demo used · create an account to continue" : "Guest mode · 1 free Developer Studio demo"}</p> : accessLabel && <p className="mt-3 inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600">{accessLabel}</p>}</div>
      <button type="button" onClick={reset} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400"><Plus size={16}/><span className="hidden sm:inline">New chat</span></button>
    </div>
    {messages.length === 0 ? <div className="grid gap-3 sm:grid-cols-3">{starters.map(([title, description]) => <button key={title} type="button" onClick={() => setInput(title === "Plan a product" ? "Help me plan a new software product, including target users, core features, pricing and launch roadmap." : title === "Design an architecture" ? "Design a production-ready software architecture including database, authentication, APIs and deployment." : "Create a detailed master prompt for an AI coding assistant to build my product in testable phases.")} className="rounded-xl border border-zinc-200 bg-white p-3 text-left hover:border-zinc-400 hover:bg-zinc-50 sm:rounded-2xl sm:p-4"><span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-700"><FileText size={17}/></span><span className="mt-3 block text-[13px] font-semibold text-zinc-900 sm:mt-4 sm:text-sm">{title}</span><span className="mt-1 block text-[11px] leading-4 text-zinc-500 sm:text-xs sm:leading-5">{description}</span></button>)}</div> : <div className="space-y-6">{messages.map((m) => <article key={m.id} className={m.role === "user" ? "ml-6 rounded-2xl bg-zinc-100 px-4 py-3.5 sm:ml-20 sm:px-5" : "mr-2 px-1 py-2 sm:mr-10"}><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{m.role === "user" ? "You" : "BluiSkill"}</p><p className="whitespace-pre-wrap text-sm leading-7 text-zinc-800">{m.content}</p>{m.result && <button type="button" onClick={() => { setResult(m.result || null); setOpen(true); }} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800"><FileText size={16}/>View structured results<Ellipsis size={17}/></button>}</article>)}{busy && <div role="status" className="flex items-center gap-3 px-2 py-4 text-sm text-zinc-500"><LoaderCircle size={18} className="animate-spin"/>Building your project plan…</div>}<div ref={bottomRef}/></div>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-700">{error}</p>}
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-[#FAFAFA]/95 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:px-6 sm:pt-3">
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="mx-auto min-w-0 max-w-4xl rounded-2xl border border-zinc-300 bg-white p-2 shadow-[0_8px_35px_rgba(0,0,0,0.08)] focus-within:border-zinc-500 sm:p-3">
        <div className="mx-1 min-w-0 rounded-xl border border-zinc-200 bg-zinc-50/70 px-2 focus-within:border-zinc-400"><textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={2} maxLength={12000} aria-label="Message BluiSkill" placeholder="Ask BluiSkill to plan, design or document your product…" className="block max-h-40 min-h-[52px] w-full min-w-0 resize-y border-0 bg-transparent px-1 py-2.5 text-[14px] leading-5 text-zinc-950 outline-none placeholder:text-zinc-400 focus:ring-0 sm:text-sm sm:leading-6"/></div>{stack === "Custom" && <div className="mx-1 mt-2 rounded-xl border border-zinc-200 bg-white p-3"><label htmlFor="custom-stack" className="mb-1.5 block text-xs font-semibold text-zinc-700">Describe your technology stack</label><textarea id="custom-stack" value={customStack} onChange={(e) => setCustomStack(e.target.value)} rows={3} maxLength={2000} placeholder="Example: Python + FastAPI, PostgreSQL, Redis, Docker, AWS…" className="block w-full min-w-0 resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] leading-5 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 sm:text-sm"/></div>}
        <div className="flex items-center justify-between gap-2 px-1 pb-1"><div className="relative flex items-center gap-2"><button type="button" aria-label="Composer options" onClick={() => setOptions(!options)} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100"><Plus size={17}/></button>{options && <div className="absolute bottom-12 left-0 z-40 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl"><p className="px-2 py-1 text-xs font-semibold text-zinc-500">Development stack</p>{["Next.js + Supabase","Node.js + PostgreSQL","React + Firebase","Custom"].map((s) => <button key={s} type="button" onClick={() => { setStack(s); setOptions(false); }} className={"block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-50 " + (stack === s ? "font-semibold text-black" : "text-zinc-600")}>{s}</button>)}</div>}<span className="hidden max-w-[180px] truncate text-xs text-zinc-500 sm:inline" title={stack === "Custom" ? customStack || "Custom stack" : stack}>{stack === "Custom" ? (customStack.trim() ? "Custom stack added" : "Custom stack") : stack}</span></div><button type="submit" disabled={!input.trim() || busy || !guestReady} aria-label="Send message" className="inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl bg-black px-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"><span className="hidden sm:inline">{busy ? "Working…" : "Send"}</span>{busy ? <LoaderCircle size={17} className="animate-spin"/> : <ArrowUp size={18}/>}</button></div>
      </form><p className="mx-auto mt-2 max-w-4xl text-center text-[10px] text-zinc-400">Review generated output before using it in production.</p>
    </div>
    {open && result && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="results-title" className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:rounded-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 py-4 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Structured output</p><h2 id="results-title" className="mt-1 truncate text-lg font-semibold text-zinc-950 sm:text-xl">{result.projectName}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close results" className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"><X size={17}/></button></header>
      <div className="flex items-center justify-between border-b border-zinc-200 px-2 sm:px-4"><div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label="Result sections">{tabItems.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setCopied(false); }} className={"whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold sm:text-sm " + (tab === t.id ? "border-black text-black" : "border-transparent text-zinc-500 hover:text-black")}>{t.label}</button>)}</div><div className="ml-2 flex shrink-0 items-center gap-1"><button type="button" onClick={() => void copy()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"><Clipboard size={14}/><span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span></button><button type="button" onClick={downloadMarkdown} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50" aria-label="Download Markdown"><Download size={14}/><span className="hidden sm:inline">Download .MD</span></button></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">{tab === "roadmap" ? <><RoadmapDiagram phases={result.roadmap} canExport={!isGuest && hasPaidAccess} onLocked={() => setPaywallOpen(true)}/><div className="space-y-4">{result.roadmap.map((p, i) => <article key={p.title + i} className="rounded-xl border border-zinc-200 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Phase {i + 1}</p><h3 className="mt-1 font-semibold text-zinc-950">{p.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-600">{p.goal}</p><h4 className="mt-4 text-xs font-semibold uppercase text-zinc-500">Tasks</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-800">{p.tasks.map((x, j) => <li key={j}>{x}</li>)}</ul><h4 className="mt-4 text-xs font-semibold uppercase text-zinc-500">Acceptance criteria</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-800">{p.acceptanceCriteria.map((x, j) => <li key={j}>{x}</li>)}</ul></article>)}</div></> : <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-800">{contentForTab() || "No content returned for this section."}</pre>}</div>
      <footer className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 sm:px-6"><span className="text-xs text-zinc-500">BluiSkill · Generated output</span><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-zinc-800">Done</button></footer>
    </section></div>}
    {paywallOpen && <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setPaywallOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="guest-paywall-title" className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">BluiSkill · Access</span><button type="button" onClick={() => setPaywallOpen(false)} aria-label="Close paywall" className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"><X size={17}/></button></div>
        <h2 id="guest-paywall-title" className="text-xl font-semibold tracking-tight text-zinc-950">Unlock full access to BluiSkill</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Create a free account or choose a pass to use this advanced feature.</p>
        <div className="mt-6 grid gap-3">
          <button type="button" onClick={() => router.push("/signup?next=%2Fdashboard")} className="min-h-11 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800">Sign in / Create account</button>
          <button type="button" onClick={() => router.push("/dashboard/billing")} className="min-h-11 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">View plans from $0.49</button>
        </div>
        <p className="mt-4 text-center text-xs leading-5 text-zinc-500">An account unlocks authenticated access. Online payments are not enabled yet.</p>
      </section>
    </div>}
  </div>;
}
