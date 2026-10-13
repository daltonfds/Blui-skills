"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Github, Globe, LoaderCircle, ShieldCheck, Code2, ExternalLink } from "lucide-react";

type Finding = { title: string; severity: string; location: string; explanation: string; impact: string; recommendation: string; evidence: string };
type Audit = { riskScore: string; summary: string; findings: Finding[]; fixPrompt: string };
type Repository = { id: number; fullName: string; name: string; private: boolean; defaultBranch: string; url: string; description: string | null; updatedAt: string };
type Tab = "github" | "url" | "snippet";
const tabClass = (active: boolean) => "inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition " + (active ? "bg-black text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950");
const riskStyles: Record<string, string> = {
  CRITICAL: "border-red-500/30 bg-red-500/10 text-red-700",
  HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-700",
  MEDIUM: "border-yellow-500/30 bg-yellow-500/10 text-yellow-800",
  LOW: "border-zinc-300 bg-zinc-100 text-zinc-700",
  SAFE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
};

export default function AuditPage() {
  const [tab, setTab] = useState<Tab>("github");
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("snippet.ts");
  const [url, setUrl] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [repository, setRepository] = useState("");
  const [branch, setBranch] = useState("main");
  const [githubState, setGithubState] = useState<"loading" | "ready" | "connect" | "error">("loading");
  const [githubMessage, setGithubMessage] = useState("");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedRepo = useMemo(() => repositories.find((item) => item.fullName === repository), [repositories, repository]);

  async function loadRepositories() {
    setGithubState("loading");
    setGithubMessage("");
    try {
      const response = await fetch("/api/audit-github-repo", { cache: "no-store" });
      const body = await response.json();
      if (response.status === 409) {
        setGithubState("connect");
        setGithubMessage(body.error || "Connect your GitHub account to continue.");
        return;
      }
      if (!response.ok) throw new Error(body.error || "Could not load repositories.");
      const list = body.repositories as Repository[];
      setRepositories(list);
      setRepository((current) => list.some((item) => item.fullName === current) ? current : list[0]?.fullName || "");
      if (list[0] && !repository) setBranch(list[0].defaultBranch || "main");
      setGithubState("ready");
    } catch (e) {
      setGithubState("error");
      setGithubMessage(e instanceof Error ? e.message : "Could not load repositories.");
    }
  }
  useEffect(() => { void loadRepositories(); }, []);

  async function connectGitHub() {
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.linkIdentity({
      provider: "github",
      options: { scopes: "repo read:user", redirectTo: window.location.origin + "/auth/callback" },
    });
    if (oauthError) setError(oauthError.message);
  }
  async function runAudit() {
    setBusy(true);
    setError("");
    setAudit(null);
    try {
      let endpoint = "";
      let payload: Record<string, string> = {};
      if (tab === "github") {
        if (!selectedRepo) throw new Error("Choose a GitHub repository first.");
        endpoint = "/api/audit-github-repo";
        payload = { owner: selectedRepo.fullName.split("/")[0], repo: selectedRepo.name, branch: branch.trim() || selectedRepo.defaultBranch };
      } else if (tab === "url") {
        endpoint = "/api/audit-live-url";
        payload = { url: url.trim() };
      } else {
        endpoint = "/api/audit-security";
        payload = { code, filename };
      }
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Audit failed.");
      setAudit(body.result as Audit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); }
    catch { setError("Clipboard access failed. Select and copy the text manually."); }
  }
  const canRun = !busy && (tab === "github" ? Boolean(selectedRepo && branch.trim()) : tab === "url" ? /^https:\/\/\S+/i.test(url.trim()) : code.trim().length >= 20);

  return <>
    <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">Security audit</h1><span className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Beta</span></div>

    <section className="mt-7 max-w-5xl rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4" role="tablist" aria-label="Audit source">
        <button type="button" role="tab" aria-selected={tab === "github"} onClick={() => { setTab("github"); setError(""); }} className={tabClass(tab === "github")}><Github size={16}/> GitHub Repo</button>
        <button type="button" role="tab" aria-selected={tab === "url"} onClick={() => { setTab("url"); setError(""); }} className={tabClass(tab === "url")}><Globe size={16}/> Live URL</button>
        <button type="button" role="tab" aria-selected={tab === "snippet"} onClick={() => { setTab("snippet"); setError(""); }} className={tabClass(tab === "snippet")}><Code2 size={16}/> Paste Snippet</button>
      </div>

      {tab === "github" && <div className="pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-semibold">Connect a repository</h2><p className="mt-1 text-sm text-zinc-500">Choose a repository you own or have permission to review.</p></div>
          <button type="button" onClick={() => void loadRepositories()} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium hover:bg-zinc-50">Refresh repositories</button>
        </div>
        {githubState === "loading" && <p className="mt-5 text-sm text-zinc-500"><LoaderCircle className="mr-2 inline animate-spin" size={15}/>Loading your repositories…</p>}
        {githubState === "connect" && <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4"><p className="text-sm text-zinc-700">{githubMessage}</p><button type="button" onClick={() => void connectGitHub()} className="mt-3 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"><Github className="mr-2 inline" size={16}/>Connect GitHub</button><p className="mt-3 text-xs leading-5 text-zinc-500">Enable GitHub in Supabase Auth and identity linking. For private repositories, configure the repo OAuth scope; the scanner only reads repository contents.</p></div>}
        {githubState === "error" && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{githubMessage}<button type="button" onClick={() => void loadRepositories()} className="ml-2 underline">Try again</button></div>}
        {githubState === "ready" && <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block text-sm font-medium">Repository
            <select value={repository} onChange={(event) => { const next = repositories.find((item) => item.fullName === event.target.value); setRepository(event.target.value); if (next) setBranch(next.defaultBranch); }} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:border-zinc-900">
              {repositories.length === 0 && <option value="">No repositories found</option>}
              {repositories.map((item) => <option key={item.id} value={item.fullName}>{item.fullName}{item.private ? " · Private" : ""}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Branch
            <input value={branch} onChange={(event) => setBranch(event.target.value)} maxLength={250} placeholder="main" className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:border-zinc-900"/>
          </label>
          {selectedRepo && <div className="md:col-span-2 rounded-lg bg-zinc-50 p-3"><p className="text-sm font-medium">{selectedRepo.fullName}</p><p className="mt-1 text-xs text-zinc-500">{selectedRepo.description || "No repository description"} · Default branch: {selectedRepo.defaultBranch}</p><a href={selectedRepo.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-900 hover:underline">Open on GitHub <ExternalLink size={12}/></a></div>}
          <p className="md:col-span-2 text-xs leading-5 text-zinc-500">The scanner reviews a bounded selection of source/configuration files. Secret-bearing .env files are excluded and detected secret patterns are redacted before AI analysis.</p>
        </div>}
      </div>}

      {tab === "url" && <div className="pt-5">
        <h2 className="font-semibold">Scan a live website</h2><p className="mt-1 text-sm text-zinc-500">Checks common HTTP security headers and a few public exposure paths on a public HTTPS host.</p>
        <label className="mt-5 block text-sm font-medium">Target website URL
          <input value={url} onChange={(event) => setUrl(event.target.value)} type="url" inputMode="url" placeholder="https://your-app.vercel.app" className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:border-zinc-900"/>
        </label>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Only scan websites you own or are authorized to assess. Private-network targets and unsafe redirects are blocked. This is not a penetration test.</p>
      </div>}

      {tab === "snippet" && <div className="pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm font-medium">File name<input value={filename} onChange={(event) => setFilename(event.target.value)} maxLength={160} className="ml-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"/></label>
          <span className="text-xs text-zinc-500">{code.length.toLocaleString()} / 30,000 characters</span>
        </div>
        <textarea value={code} onChange={(event) => setCode(event.target.value)} maxLength={30000} rows={14} spellCheck={false} placeholder="// Paste code here…" className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-6 text-zinc-800 outline-none focus:border-zinc-900"/>
        <p className="mt-2 text-xs text-zinc-500">Do not paste live production secrets, private keys, or personal identifiers.</p>
      </div>}

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="button" disabled={!canRun} onClick={() => void runAudit()} className="mt-5 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? <><LoaderCircle className="mr-2 inline animate-spin" size={16}/>Analyzing…</> : <><ShieldCheck className="mr-2 inline" size={16}/>{tab === "github" ? "Scan GitHub repository" : tab === "url" ? "Scan live website" : "Audit code"} · 1 credit</>}
      </button>
    </section>

    {audit && <section className="mt-8 max-w-5xl">
      <div className={"rounded-xl border p-5 " + (riskStyles[audit.riskScore] || riskStyles.MEDIUM)}>
        <p className="text-xs font-semibold tracking-wider">OVERALL RISK LEVEL</p><h2 className="mt-2 text-2xl font-bold">{audit.riskScore}</h2><p className="mt-2 text-sm leading-6">{audit.summary}</p>
      </div>
      <h2 className="mt-7 text-xl font-semibold">Findings ({audit.findings?.length || 0})</h2>
      <div className="mt-4 space-y-3">{(audit.findings || []).map((finding, index) => <article key={index} className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{finding.title}</h3><span className={"rounded-md border px-2 py-1 text-xs " + (riskStyles[finding.severity] || riskStyles.LOW)}>{finding.severity}</span></div>
        <p className="mt-2 text-xs text-zinc-500">{finding.location}</p><p className="mt-3 text-sm leading-6 text-zinc-700">{finding.explanation}</p><p className="mt-3 text-sm"><span className="text-zinc-500">Impact: </span>{finding.impact}</p><p className="mt-2 text-sm"><span className="text-zinc-500">Recommendation: </span>{finding.recommendation}</p>
        {finding.evidence && <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">{finding.evidence}</pre>}
      </article>)}</div>
      <div className="mt-7 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Instant security patch prompt</h2><button type="button" onClick={() => void copy(audit.fixPrompt || "")} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium hover:bg-zinc-50"><Copy className="mr-1 inline" size={14}/>Copy fix prompt</button></div>
        <pre className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{audit.fixPrompt}</pre>
      </div>
      <p className="mt-4 text-xs leading-5 text-zinc-500">AI-assisted review can miss issues or produce false positives. Validate all findings and fixes with suitable security tooling and code review.</p>
    </section>}
  </>;
}
