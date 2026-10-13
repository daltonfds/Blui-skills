"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Check, Clipboard, Code2, Database, Download, FileText, FolderOpen,
  LoaderCircle, Plus, ShieldAlert, Sparkles, Upload, X,
} from "lucide-react";

type DocsResult = {
  readme: string;
  dataDictionary: string;
  apiReference: string;
  contextPrompt: string;
};
type DocTab = keyof DocsResult;
type SavedDocument = {
  id: string;
  project_name: string;
  documents: DocsResult;
  source_files: string[];
  created_at: string;
};
type SourceFile = { file: File; name: string };

const tabs: { id: DocTab; label: string; title: string; filename: string; icon: typeof FileText }[] = [
  { id: "readme", label: "README.md", title: "Project README", filename: "README.md", icon: BookOpen },
  { id: "dataDictionary", label: "Database", title: "Data Dictionary & Entities", filename: "DATA-DICTIONARY.md", icon: Database },
  { id: "apiReference", label: "APIs & Routes", title: "API & Frontend Route Reference", filename: "API-REFERENCE.md", icon: Code2 },
  { id: "contextPrompt", label: "Context Prompt", title: "AI Context Prompt", filename: "BLUI-CONTEXT-PROMPT.md", icon: Sparkles },
];
const allowedExtensions = /\.(md|txt|json|sql|ts|tsx|js|jsx|mjs|cjs|yml|yaml|prisma|toml|css|html|xml|sh|py|go|rs|java|php|env\.example)$/i;
const MAX_SOURCE_CHARS = 45000;

export default function DocsGeneratorPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [source, setSource] = useState("");
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [result, setResult] = useState<DocsResult | null>(null);
  const [saved, setSaved] = useState<SavedDocument[]>([]);
  const [activeTab, setActiveTab] = useState<DocTab>("readme");
  const [mobileStep, setMobileStep] = useState<"input" | "result">("input");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/generate-docs", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json();
        if (Array.isArray(body.documents)) setSaved(body.documents as SavedDocument[]);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const inputChars = source.length + files.reduce((total, item) => total + item.file.size, 0);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    setNotice("");
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!allowedExtensions.test(file.name) || file.name === ".env" || file.name.startsWith(".env.") && file.name !== ".env.example") {
        setError(file.name + " was skipped. Upload source/configuration text files only; real .env files and secrets are not accepted.");
        continue;
      }
      if (file.size > 150 * 1024) {
        setError(file.name + " is over the 150 KB per-file limit and was skipped.");
        continue;
      }
      if (next.some((item) => item.name === file.name)) continue;
      next.push({ file, name: file.name });
    }
    setFiles(next.slice(0, 20));
  }

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setCopied(false);
    try {
      const sections: string[] = [];
      if (source.trim()) sections.push("## Pasted project notes / code\n" + source.trim());
      const sourceFiles: string[] = [];
      for (const item of files) {
        const text = await item.file.text();
        sourceFiles.push(item.name);
        sections.push("## FILE: " + item.name + "\n\`\`\`\n" + text + "\n\`\`\`");
      }
      const combined = sections.join("\n\n");
      if (combined.trim().length < 40) throw new Error("Paste project details or upload at least one source file.");
      if (combined.length > MAX_SOURCE_CHARS) throw new Error("Combined project source exceeds 45,000 characters. Remove files or shorten the pasted content.");
      const response = await fetch("/api/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, source: combined, sourceFiles }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not generate documentation.");
      setResult(body.result as DocsResult);
      setActiveTab("readme");
      setMobileStep("result");
      setNotice("Documentation generated and saved. One credit was used.");
      router.refresh();
      const historyResponse = await fetch("/api/generate-docs");
      if (historyResponse.ok) {
        const historyBody = await historyResponse.json();
        if (Array.isArray(historyBody.documents)) setSaved(historyBody.documents as SavedDocument[]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setNotice("Markdown copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Clipboard access was blocked. Select the Markdown text and copy it manually.");
    }
  }

  function downloadMarkdown(filename: string, value: string) {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function openSaved(item: SavedDocument) {
    setProjectName(item.project_name);
    setResult(item.documents);
    setActiveTab("readme");
    setMobileStep("result");
    setError("");
    setNotice("Opened saved documentation.");
  }

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const CurrentIcon = currentTab.icon;

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-4">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Docs Generator</h1>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] xl:gap-6">
        <section className={(mobileStep === "result" ? "hidden lg:block " : "") + "min-w-0 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 sm:p-6"}>
          <div className="mb-5"><h2 className="text-lg font-semibold text-zinc-950">Bring your existing code</h2></div>

          <form onSubmit={generate}>
            <label htmlFor="project-name" className="block text-sm font-medium text-zinc-900">Project name <span className="font-normal text-zinc-400">(optional)</span></label>
            <input id="project-name" value={projectName} maxLength={120} onChange={(event) => setProjectName(event.target.value)}
              placeholder="e.g. MySaaS, client-dashboard"
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10" />

            <label htmlFor="project-source" className="mt-5 block text-sm font-medium text-zinc-900">Project structure &amp; key code</label>
            <textarea id="project-source" value={source} onChange={(event) => setSource(event.target.value)} rows={9}
              placeholder={"Paste your folder tree, package.json, schema.sql, API routes, server actions or other key files…\n\nExample:\napp/api/...\nsupabase/schema.sql\npackage.json"}
              className="mt-2 min-h-48 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 font-mono text-xs leading-6 text-zinc-800 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10" />

            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600"><Upload size={17} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">Upload source files</p>
                  <label className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100">
                    <Plus size={14} /> Choose files
                    <input type="file" multiple accept=".md,.txt,.json,.sql,.ts,.tsx,.js,.jsx,.mjs,.cjs,.yml,.yaml,.prisma,.toml,.css,.html,.xml,.sh,.py,.go,.rs,.java,.php,.env.example" className="sr-only" onChange={(event) => { void addFiles(event.target.files); event.currentTarget.value = ""; }} />
                  </label>
                </div>
              </div>
              {files.length > 0 && <div className="mt-4 space-y-2">
                {files.map((item) => <div key={item.name} className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-700">
                  <FileText size={14} className="shrink-0 text-zinc-400" /><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="shrink-0 text-zinc-400">{Math.max(1, Math.round(item.file.size / 1024))} KB</span>
                  <button type="button" aria-label={"Remove " + item.name} onClick={() => setFiles((current) => current.filter((f) => f.name !== item.name))} className="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"><X size={13} /></button>
                </div>)}
              </div>}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">
              <ShieldAlert size={15} className="mt-0.5 shrink-0" />
              <p>Remove passwords, API keys, tokens and customer data before submitting. Never upload a real <code>.env</code> file or private keys.</p>
            </div>

            {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-6 text-red-700">{error}</p>}
            {notice && !error && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-6 text-emerald-800">{notice}</p>}

            <button type="submit" disabled={busy || (!source.trim() && files.length === 0)}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? <><LoaderCircle size={17} className="mr-2 animate-spin" />Analysing project…</> : "Generate documentation"}
            </button>
          </form>

          {saved.length > 0 && (
            <div className="mt-7 border-t border-zinc-200 pt-5">
              <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-zinc-900">Recent documentation</h3><span className="text-xs text-zinc-400">{saved.length} saved</span></div>
              <div className="space-y-2">
                {saved.slice(0, 5).map((item) => <button key={item.id} type="button" onClick={() => openSaved(item)} className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 p-3 text-left transition hover:border-zinc-300 hover:bg-zinc-50/40">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600"><FileText size={15} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-zinc-900">{item.project_name}</span><span className="mt-1 block text-xs text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</span></span>
                  <span className="text-xs text-zinc-700">Open</span>
                </button>)}
              </div>
            </div>
          )}
        </section>

        <section className={(mobileStep === "input" ? "hidden lg:block " : "") + "min-w-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm"}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600"><CurrentIcon size={17} /></span>
              <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">02 / Documentation kit</p><h2 className="mt-1 truncate text-lg font-semibold text-zinc-950">{result ? (projectName.trim() || "Existing project") : "Your documents"}</h2></div>
            </div>
            {result ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Check size={13} /> Saved</span> : <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500">Preview</span>}
          </div>

          {!result && !busy && <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[540px]">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500"><BookOpen size={22} /></div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900">A developer-ready handoff</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Supply the code you have. Blui will document the evidence it finds and clearly flag anything that needs verification.</p>
            <div className="mt-6 grid w-full max-w-md gap-2 text-left sm:grid-cols-2">{tabs.map((tab) => { const Icon = tab.icon; return <div key={tab.id} className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/70 px-3 py-3 text-xs text-zinc-600"><Icon size={15} className="text-zinc-400" />{tab.label}</div>; })}</div>
          </div>}

          {busy && <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center" role="status"><LoaderCircle size={26} className="animate-spin text-zinc-700" /><h3 className="mt-4 font-semibold text-zinc-900">Reading your project evidence</h3><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Organising the README, data model, routes and context prompt. This can take a little while.</p></div>}

          {result && <>
            <div className="border-b border-zinc-200 px-2 sm:px-4"><div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Generated documents">
              {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setCopied(false); }} className={"whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition " + (activeTab === tab.id ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900")}>{tab.label}</button>)}
            </div></div>
            <div className="p-3 sm:p-5">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#09090B] text-zinc-100">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-2"><span className="text-zinc-500"><CurrentIcon size={15} /></span><div className="min-w-0"><p className="text-sm font-semibold">{currentTab.title}</p><p className="mt-1 text-xs text-zinc-400">{currentTab.filename} · Markdown</p></div></div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => downloadMarkdown(currentTab.filename, result[activeTab])} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"><Download size={14} /> Download .md</button>
                    <button type="button" onClick={() => void copyText(result[activeTab])} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700">{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied!" : "Copy Markdown"}</button>
                  </div>
                </div>
                <pre className="max-h-[720px] min-h-[360px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-zinc-200 sm:p-5">{result[activeTab]}</pre>
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">Use these files as a starting point for onboarding. Verify inferred details against the actual repository before making changes.</p>
            </div>
          </>}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-zinc-200 bg-white/95 p-2 backdrop-blur lg:hidden" aria-label="Documentation steps">
        <button type="button" onClick={() => setMobileStep("input")} className={"flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium " + (mobileStep === "input" ? "bg-zinc-100 text-zinc-950" : "text-zinc-500")}><FolderOpen size={16} /> Input</button>
        <button type="button" onClick={() => setMobileStep("result")} disabled={!result && !busy} className={"flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium " + (mobileStep === "result" ? "bg-zinc-100 text-zinc-700" : "text-zinc-500") + " disabled:opacity-40"}><FileText size={16} /> Results {result ? <Check size={14} /> : null}</button>
      </nav>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
