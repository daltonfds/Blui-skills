"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, FileSearch, LoaderCircle, Search } from "lucide-react";

type ResearchResult = { title: string; content: string; sources: Array<{title:string;url:string}>; researchedAt?: string };
const field = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10";

export default function AcademicResearchPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("Auto-detect");
  const [depth, setDepth] = useState("comprehensive");
  const [result, setResult] = useState<ResearchResult|null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("bluiskill-academic-research");
      if (saved) {
        const item = JSON.parse(saved) as {topic?:string;content?:string;sources?:Array<{title:string;url:string}>;researchedAt?:string};
        if (item.topic) setTopic(item.topic);
        if (item.content && item.sources?.length) setResult({title:item.topic||"Saved research",content:item.content,sources:item.sources,researchedAt:item.researchedAt});
      }
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get("prompt");
    const selectedLanguage = params.get("language");
    if (prompt) setTopic(prompt.slice(0,2000));
    if (selectedLanguage && ["Auto-detect","English","Português","Español","Français"].includes(selectedLanguage)) setLanguage(selectedLanguage);
  }, []);

  async function research(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); setResult(null);
    try {
      const response = await fetch("/api/academic/research", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,language,depth})});
      const body = await response.json();
      if (!response.ok || body.success === false) throw new Error(body.error || "Research could not be completed.");
      setResult(body.result as ResearchResult);
      window.localStorage.setItem("bluiskill-academic-research",JSON.stringify({topic,content:body.result.content,title:body.result.title,sources:body.result.sources,researchedAt:body.result.researchedAt}));
      setNotice("Research saved. You can reuse this material in an academic paper or study session.");
    } catch(cause) { setError(cause instanceof Error?cause.message:"An error occurred during research."); }
    finally { setBusy(false); }
  }
  function useForWriting() { if (!result) return; window.localStorage.setItem("bluiskill-academic-research",JSON.stringify({topic,content:result.content,title:result.title,sources:result.sources,researchedAt:result.researchedAt})); router.push("/dashboard/academic/paper"); }
  function useForStudy() { if (!result) return; window.localStorage.setItem("bluiskill-academic-research",JSON.stringify({topic,content:result.content,title:result.title,sources:result.sources,researchedAt:result.researchedAt})); router.push("/dashboard/academic/study"); }

  return <div className="mx-auto w-full max-w-6xl pb-12">
    <Link href="/dashboard/academic" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-700"><ArrowLeft size={15}/>Academic Workspace</Link>
    <header className="mb-7 mt-5 border-b border-zinc-200 pb-6"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500"><FileSearch size={15}/>Deep Research</div><h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Deep Research</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">Enter a research question. Search the web, organize key arguments and review source links before using the findings.</p></header>
    <form onSubmit={research} className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <label className="block text-sm font-medium text-zinc-900">Research topic or question<textarea required minLength={8} maxLength={2000} rows={5} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Example: What factors explain digital payment adoption among small businesses in Mozambique between 2020 and 2026?" className={field+" mt-2 resize-y leading-6"}/></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-zinc-900">Report language<select value={language} onChange={e=>setLanguage(e.target.value)} className={field}><option>Auto-detect</option><option>English</option><option>Português</option><option>Español</option><option>Français</option></select></label><label className="block text-sm font-medium text-zinc-900">Research depth<select value={depth} onChange={e=>setDepth(e.target.value)} className={field}><option value="comprehensive">Comprehensive</option><option value="overview">Overview</option><option value="comparative">Comparative</option></select></label></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5"><p className="max-w-xl text-xs leading-5 text-zinc-500">Verify the sources and citations. Research quality depends on page availability and search results.</p><button disabled={busy||topic.trim().length<8} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{busy?<><LoaderCircle size={16} className="animate-spin"/>Searching sources…</>:<><Search size={16}/>Start research</>}</button></div>
    </form>
    {error&&<div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><p>{error}</p><button type="button" onClick={(e)=>{const form=e.currentTarget.closest("div")?.previousElementSibling as HTMLFormElement|null;form?.requestSubmit();}} className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white">Try again</button></div>}
    {notice&&!error&&<p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    {result&&<section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Research report</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">{result.title}</h2><p className="mt-2 text-xs text-zinc-500">{result.sources.length} sources identified{result.researchedAt?" · "+new Date(result.researchedAt).toLocaleString("en-US"):""}</p></div>
      <article className="whitespace-pre-wrap px-5 py-6 text-sm leading-7 text-zinc-700 sm:px-6">{result.content}</article>
      <div className="border-t border-zinc-200 p-5 sm:p-6"><h3 className="text-sm font-semibold text-zinc-950">Sources to verify</h3><ul className="mt-3 space-y-3">{result.sources.map((source,i)=><li key={source.url} className="flex items-start gap-3"><span className="mt-0.5 text-xs text-zinc-400">{String(i+1).padStart(2,"0")}</span><div className="min-w-0"><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-blue-600">{source.title||source.url}<ExternalLink size={13} className="mt-1 shrink-0"/></a><p className="mt-1 break-all text-xs text-zinc-500">{source.url}</p></div></li>)}</ul></div>
      <div className="flex flex-wrap gap-3 border-t border-zinc-200 bg-zinc-50 p-5"><button onClick={useForWriting} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Use in academic writing<ArrowRight size={15}/></button><button onClick={useForStudy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:border-blue-500">Use for study & revision<ArrowRight size={15}/></button></div>
    </section>}
  </div>;
}
