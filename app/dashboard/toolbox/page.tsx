"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Check, Clipboard, Download, FileCode2, FileText, RefreshCw, ShieldAlert, Calculator, PackageOpen } from "lucide-react";

type Project = { id: string; title: string; description: string; tech_stack: unknown; roadmap: unknown; roadmap_steps?: unknown; master_prompt: string; prd_architecture?: unknown; created_at: string };
type Docs = { id: string; project_name: string; documents: { readme?: string; dataDictionary?: string; apiReference?: string; contextPrompt?: string }; created_at: string };
type ExportFile = { name: string; content: string };

function downloadText(name: string, content: string, type = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Small ZIP writer using the ZIP "store" method; no dependency or server required.
function makeZip(files: ExportFile[]): Blob {
  const encoder = new TextEncoder();
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc32 = (data: Uint8Array) => { let c = 0xffffffff; for (const b of data) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const u16 = (v: number) => [v & 255, (v >>> 8) & 255];
  const u32 = (v: number) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  const locals: Uint8Array[] = []; const centrals: Uint8Array[] = []; let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name); const data = encoder.encode(file.content); const crc = crc32(data);
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name, ...data]);
    locals.push(local);
    centrals.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name]));
    offset += local.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
  // Copy bytes into a fresh ArrayBuffer-backed buffer for TypeScript BlobPart compatibility.
  const parts = [...locals, ...centrals, end].map((part) => {
    const copy = new Uint8Array(part.byteLength);
    copy.set(part);
    return copy.buffer;
  });
  return new Blob(parts, { type: "application/zip" });
}

const initialEnv = "NEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\nGEMINI_API_KEY=";
const initialSchema = "-- Paste only confirmed schema SQL here. Review table names, foreign keys, RLS policies and permissions before applying.\n";

export default function DevToolboxPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [docs, setDocs] = useState<Docs[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedDocs, setSelectedDocs] = useState("");
  const [projectName, setProjectName] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [roadmap, setRoadmap] = useState("");
  const [progress, setProgress] = useState("");
  const [constraints, setConstraints] = useState("Keep the current stack and architecture. Make the smallest compatible change. Do not rewrite working features.");
  const [envInput, setEnvInput] = useState(initialEnv);
  const [schemaInput, setSchemaInput] = useState(initialSchema);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"context" | "export" | "config" | "cost">("context");
  const [stack, setStack] = useState("next-supabase");
  const [monthlyUsers, setMonthlyUsers] = useState("1000");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dev-toolbox", { signal: controller.signal }).then(async (r) => {
      if (!r.ok) return;
      const data = await r.json();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
      setDocs(Array.isArray(data.docs) ? data.docs : []);
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const p = projects.find((item) => item.id === selectedProject);
    if (!p) return;
    setProjectName(p.title);
    setArchitecture(typeof p.prd_architecture === "string" ? p.prd_architecture : JSON.stringify(p.prd_architecture ?? {}, null, 2));
    setRoadmap(JSON.stringify(p.roadmap_steps ?? p.roadmap ?? [], null, 2));
    setConstraints((old) => old || p.master_prompt || "");
  }, [selectedProject, projects]);

  const selectedDoc = docs.find((item) => item.id === selectedDocs);


  const contextPrompt = useMemo(() => {
    const sections = [
      "# Blui Context Refresh Prompt",
      "You are continuing an existing software project. Preserve working behaviour and build on the actual current repository.",
      "## Project\n" + (projectName.trim() || "Not specified"),
      "## Confirmed architecture and current design\n" + (architecture.trim() || "Not supplied; inspect the repository before deciding."),
      "## Original roadmap\n" + (roadmap.trim() || "Not supplied; do not invent completed phases."),
      "## Current progress (user-reported)\n" + (progress.trim() || "Not supplied; inspect repository and ask before assuming a phase is complete."),
      "## Constraints\n" + (constraints.trim() || "Keep changes minimal, compatible and testable."),
      "## Mandatory workflow\n1. Inspect repository status, structure and relevant files before editing.\n2. Treat source code and git history as the source of truth; compare them with the progress notes.\n3. Preserve completed phases, public interfaces, database contracts, auth, RLS and business rules.\n4. Identify the smallest safe next task and list expected files before changes.\n5. Do not rewrite working features or introduce dependencies/tables without a demonstrated need.\n6. If a migration is needed, make it additive and explain rollback/impact. Never include real secrets.\n7. Implement one coherent step, then run available typecheck/tests/build and report actual command results only.\n8. Report changed files, what remains, risks and the exact next step. If essential context is missing, ask a focused question instead of guessing.",
    ];
    return sections.join("\n\n");
  }, [projectName, architecture, roadmap, progress, constraints]);

  const envExample = useMemo(() => {
    const names = new Set<string>();
    for (const line of envInput.split(/\r?\n/)) {
      const match = line.trim().match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]{1,100})\s*(?:=.*)?$/);
      if (match) names.add(match[1]);
    }
    return [...names].sort().map((name) => name + "=").join("\n") + (names.size ? "\n" : "");
  }, [envInput]);

  const markdownFiles = useMemo<ExportFile[]>(() => {
    const p = projects.find((item) => item.id === selectedProject);
    const result: ExportFile[] = [];
    if (p) {
      const arch = p.prd_architecture && typeof p.prd_architecture === "object" ? p.prd_architecture as Record<string, unknown> : {};
      result.push({ name: "01-PRD.md", content: String(arch.prd ?? "# Product requirements\n\nNot provided in the saved project.") });
      result.push({ name: "02-ARCHITECTURE.md", content: String(arch.architecture ?? (typeof p.prd_architecture === "string" ? p.prd_architecture : "# Architecture\n\nNot provided in the saved project.")) });
      result.push({ name: "03-ROADMAP.md", content: "# Implementation roadmap\n\n" + JSON.stringify(p.roadmap_steps ?? p.roadmap ?? [], null, 2) });
      result.push({ name: "04-MASTER-PROMPT.md", content: p.master_prompt || "# Master Prompt\n\nNot provided in the saved project." });
    }
    if (selectedDoc?.documents) {
      const d = selectedDoc.documents;
      if (d.readme) result.push({ name: "docs/README.md", content: d.readme });
      if (d.dataDictionary) result.push({ name: "docs/DATA-DICTIONARY.md", content: d.dataDictionary });
      if (d.apiReference) result.push({ name: "docs/API-REFERENCE.md", content: d.apiReference });
      if (d.contextPrompt) result.push({ name: "docs/BLUI-CONTEXT-PROMPT.md", content: d.contextPrompt });
    }
    if (contextPrompt.trim()) result.push({ name: "05-CONTEXT-REFRESH-PROMPT.md", content: contextPrompt });
    if (envExample.trim()) result.push({ name: ".env.example", content: envExample });
    if (schemaInput.trim() && schemaInput.trim() !== initialSchema.trim()) result.push({ name: "schema.sql", content: schemaInput });
    return result;
  }, [projects, selectedProject, selectedDoc, architecture, roadmap, progress, constraints, envInput, schemaInput]);

  const stackEstimates: Record<string, { title: string; base: number; variable: number; note: string }> = {
    "next-supabase": { title: "Next.js + Supabase + Gemini", base: 0, variable: 0.002, note: "Base assumes eligible free tiers and low usage; AI estimate is a placeholder per request, not a live provider quote." },
    "next-managed": { title: "Next.js + managed database + AI API", base: 10, variable: 0.01, note: "Illustrative paid baseline; actual hosting/database plans and model pricing vary by region, provider and usage." },
    "custom": { title: "Custom stack", base: 0, variable: 0, note: "Enter your own provider assumptions outside this calculator; no stack details were supplied." },
  };
  const estimate = stackEstimates[stack];
  const users = Math.max(0, Number(monthlyUsers) || 0);
  const monthly = estimate.base + users * estimate.variable;

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setNotice(label + " copied."); }
    catch { setNotice("Clipboard access blocked. Select the text and copy it manually."); }
  }
  function exportZip() {
    if (!markdownFiles.length) { setNotice("Choose a saved project or Docs Generator result first."); return; }
    const blob = makeZip(markdownFiles);
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = (projectName.trim().replace(/[^a-z0-9-_]+/gi, "-") || "blui-project") + "-kit.zip"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("ZIP kit generated locally. No AI credits used.");
  }

  return <div className="mx-auto w-full max-w-6xl pb-8">
    <header className="mb-7">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Blui</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Dev Toolbox</h1>
    </header>
    <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
      {([["context","Context refresh"],["export","Export kit"],["config","Config generator"],["cost","Stack calculator"]] as const).map(([id,label]) => <button key={id} onClick={() => setActiveTab(id)} className={"rounded-lg px-3 py-2 text-sm font-medium " + (activeTab===id ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50")}>{label}</button>)}
    </div>
    {notice && <p role="status" className="mb-4 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-800">{notice}</p>}
    <section className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-semibold text-zinc-950">Project sources</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700">Architect project
          <select value={selectedProject} onChange={(e)=>setSelectedProject(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="">Select a saved project…</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
        </label>
        <label className="block text-sm font-medium text-zinc-700">Docs Generator result
          <select value={selectedDocs} onChange={(e)=>setSelectedDocs(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="">Select saved documentation…</option>{docs.map(d=><option key={d.id} value={d.id}>{d.project_name} · {new Date(d.created_at).toLocaleDateString()}</option>)}</select>
        </label>
      </div>
      {projects.length===0 && docs.length===0 && <p className="mt-3 text-xs text-amber-700">No saved items loaded. You can still create a prompt manually. If you expected saved items, check your account and database migrations.</p>}
    </section>

    {activeTab==="context" && <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 sm:p-6">
      <div className="flex items-center gap-2"><RefreshCw size={18} className="text-zinc-700"/><h2 className="text-lg font-semibold">Context Refresh Prompt</h2></div>
      <p className="mt-1 text-sm text-zinc-500">This prompt is built locally from your selected Architect project and the progress you enter. It does not claim to know your live repository state.</p>
      <label className="mt-5 block text-sm font-medium">Project name<input value={projectName} onChange={e=>setProjectName(e.target.value)} maxLength={120} className="mt-2 min-h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm" placeholder="Project name"/></label>
      <label className="mt-4 block text-sm font-medium">Architecture / current design<textarea value={architecture} onChange={e=>setArchitecture(e.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-zinc-200 p-3 font-mono text-xs leading-5" placeholder="Paste confirmed architecture, important constraints and current interfaces…"/></label>
      <label className="mt-4 block text-sm font-medium">Original roadmap<textarea value={roadmap} onChange={e=>setRoadmap(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-zinc-200 p-3 font-mono text-xs leading-5" placeholder="Roadmap phases, tasks and acceptance criteria…"/></label>
      <label className="mt-4 block text-sm font-medium">Current progress and next task<textarea value={progress} onChange={e=>setProgress(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-sm leading-6" placeholder="Completed: …\nIn progress: …\nBlocked by: …\nNext goal: …"/></label>
      <label className="mt-4 block text-sm font-medium">Rules to preserve<textarea value={constraints} onChange={e=>setConstraints(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-sm leading-6"/></label>
      <div className="mt-5 flex flex-wrap gap-2"><button onClick={()=>void copy(contextPrompt,"Context Refresh Prompt")} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"><Clipboard size={16}/>Copy prompt</button><button onClick={()=>downloadText("CONTEXT-REFRESH-PROMPT.md",contextPrompt)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold"><Download size={16}/>Download .md</button></div>
      <pre className="mt-5 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-zinc-800 bg-[#09090B] p-4 font-mono text-xs leading-6 text-zinc-100">{contextPrompt}</pre>
    </section>}

    {activeTab==="export" && <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 sm:p-6">
      <div className="flex items-center gap-2"><Archive size={18} className="text-zinc-700"/><h2 className="text-lg font-semibold">Markdown and ZIP export</h2></div>
      <p className="mt-1 text-sm text-zinc-500">Exports are generated in your browser, use no AI credits and create no database rows.</p>
      <div className="mt-5 flex flex-wrap gap-2"><button onClick={exportZip} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"><PackageOpen size={16}/>Download ZIP kit ({markdownFiles.length} files)</button></div>
      <div className="mt-4 divide-y divide-zinc-100 rounded-lg border border-zinc-200">{markdownFiles.map(file=><div key={file.name} className="flex flex-wrap items-center gap-3 p-3"><FileText size={16} className="text-zinc-400"/><span className="min-w-0 flex-1 break-all text-sm font-medium">{file.name}</span><button onClick={()=>downloadText(file.name.split("/").pop()||file.name,file.content)} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-2 text-xs font-semibold"><Download size={14}/> .md / file</button></div>)}</div>
      {!markdownFiles.length && <p className="mt-4 text-sm text-zinc-500">Select a saved Architect project or Docs Generator result above to populate the export kit.</p>}
    </section>}

    {activeTab==="config" && <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 sm:p-6">
      <div className="flex items-center gap-2"><FileCode2 size={18} className="text-zinc-700"/><h2 className="text-lg font-semibold">Configuration generator</h2></div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><ShieldAlert size={16} className="mt-0.5 shrink-0"/>Only variable names and schema you provide are used. This tool does not infer database tables or validate SQL against a live database. Never paste secret values.</div>
      <label className="mt-5 block text-sm font-medium">Confirmed environment variable names<textarea value={envInput} onChange={e=>setEnvInput(e.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-zinc-200 p-3 font-mono text-xs leading-5" placeholder="NEXT_PUBLIC_SUPABASE_URL=\nGEMINI_API_KEY="/></label>
      <div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>void copy(envExample,".env.example")} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"><Clipboard size={15}/>Copy .env.example</button><button onClick={()=>downloadText(".env.example",envExample,"text/plain;charset=utf-8")} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold"><Download size={15}/>Download .env.example</button></div>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-[#09090B] p-3 font-mono text-xs leading-5 text-zinc-100">{envExample || "# Add confirmed variable names above"}</pre>
      <label className="mt-6 block text-sm font-medium">Confirmed schema SQL<textarea value={schemaInput} onChange={e=>setSchemaInput(e.target.value)} rows={9} className="mt-2 w-full rounded-lg border border-zinc-200 p-3 font-mono text-xs leading-5" placeholder="Paste verified CREATE TABLE, constraints and RLS policies…"/></label>
      <div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>void copy(schemaInput,"schema.sql")} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"><Clipboard size={15}/>Copy schema.sql</button><button onClick={()=>downloadText("schema.sql",schemaInput,"text/sql;charset=utf-8")} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold"><Download size={15}/>Download schema.sql</button></div>
      <p className="mt-3 text-xs leading-5 text-zinc-500">Review constraints, foreign keys, grants and RLS policies, then test the SQL in a non-production environment before applying it.</p>
    </section>}

    {activeTab==="cost" && <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 sm:p-6">
      <div className="flex items-center gap-2"><Calculator size={18} className="text-zinc-700"/><h2 className="text-lg font-semibold">Stack cost estimator</h2></div>
      <p className="mt-1 text-sm text-zinc-500">Illustrative planning only, not a live quote or guarantee. Provider pricing, free-tier eligibility, limits, region, storage, bandwidth and model/token usage can change.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Stack assumption<select value={stack} onChange={e=>setStack(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3"><option value="next-supabase">Next.js + Supabase + Gemini</option><option value="next-managed">Next.js + paid managed services</option><option value="custom">Custom / unknown</option></select></label>
        <label className="block text-sm font-medium">Monthly AI requests (rough proxy)<input type="number" min="0" max="10000000" value={monthlyUsers} onChange={e=>setMonthlyUsers(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-200 px-3"/></label>
      </div>
      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Illustrative monthly baseline</p><p className="mt-2 text-3xl font-semibold">{stack==="custom" ? "Unknown" : "US$" + monthly.toFixed(2)}</p><p className="mt-2 text-sm leading-6 text-zinc-600">{estimate.note}</p><p className="mt-3 text-xs text-zinc-500">Calculation: {stack==="custom" ? "No assumptions available." : "US$"+estimate.base.toFixed(2)+" illustrative base + "+users.toLocaleString()+" requests × US$"+estimate.variable.toFixed(3)+" placeholder per request."}</p></div>
      <p className="mt-4 text-xs leading-5 text-zinc-500">The request allowance is a simplified proxy, not token-based billing. Check official pricing and free-tier quotas before committing to a budget. This calculator does not fetch current provider prices.</p>
    </section>}
    <p className="mt-6 text-xs text-zinc-400">Blui Dev Toolbox · Fase 1 · downloads are local · prompt/config generation uses no AI credits.</p>
  </div>;
}
