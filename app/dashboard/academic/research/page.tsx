"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, FileSearch, LoaderCircle, Search } from "lucide-react";

type ResearchResult = { title: string; content: string; sources: Array<{title:string;url:string}>; researchedAt?: string };
const field = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export default function AcademicResearchPage() {
  const router=useRouter();
  const [topic,setTopic]=useState("");
  const [language,setLanguage]=useState("Português");
  const [depth,setDepth]=useState("aprofundada");
  const [result,setResult]=useState<ResearchResult|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  async function research(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setNotice("");setResult(null);
    try{
      const response=await fetch("/api/academic/research",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,language,depth})});
      const body=await response.json();if(!response.ok)throw new Error(body.error||"Não foi possível concluir a pesquisa.");
      setResult(body.result as ResearchResult);
      window.localStorage.setItem("bluiskill-academic-research",JSON.stringify({topic,content:body.result.content,title:body.result.title,sources:body.result.sources}));
      setNotice("Pesquisa guardada. Podes reutilizar este material num trabalho ou numa sessão de estudo.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Ocorreu um erro ao pesquisar.");}
    finally{setBusy(false);}
  }
  function useForWriting(){if(!result)return;window.localStorage.setItem("bluiskill-academic-research",JSON.stringify({topic,content:result.content,title:result.title,sources:result.sources}));router.push("/dashboard/academic/paper");}
  function useForStudy(){if(!result)return;window.localStorage.setItem("bluiskill-academic-research",JSON.stringify({topic,content:result.content,title:result.title,sources:result.sources}));router.push("/dashboard/academic/study");}
  return <div className="mx-auto w-full max-w-6xl pb-12">
    <Link href="/dashboard/academic" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black"><ArrowLeft size={15}/> Academic</Link>
    <header className="mb-7 mt-5 border-b border-zinc-200 pb-6"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500"><FileSearch size={15}/> Academic Research</div><h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Pesquisa aprofundada</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">Define uma pergunta de investigação. A pesquisa procura fontes na web, organiza os principais argumentos e apresenta ligações para poderes verificar a informação antes de a usar.</p></header>
    <form onSubmit={research} className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <label className="block text-sm font-medium text-zinc-900">Tema ou pergunta de investigação<textarea required minLength={8} maxLength={2000} rows={5} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Ex.: Que factores explicam a adopção de pagamentos digitais nas pequenas empresas em Moçambique entre 2020 e 2026?" className={field+" mt-2 resize-y leading-6"}/></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-zinc-900">Idioma do relatório<select value={language} onChange={e=>setLanguage(e.target.value)} className={field}><option>Português</option><option>English</option><option>Español</option><option>Français</option></select></label><label className="block text-sm font-medium text-zinc-900">Profundidade<select value={depth} onChange={e=>setDepth(e.target.value)} className={field}><option value="aprofundada">Aprofundada</option><option value="panorâmica">Panorâmica</option><option value="comparativa">Comparativa</option></select></label></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5"><p className="max-w-xl text-xs leading-5 text-zinc-500">As fontes e as citações devem ser verificadas. A qualidade da pesquisa depende da disponibilidade das páginas e dos resultados encontrados.</p><button disabled={busy||topic.trim().length<8} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">{busy?<><LoaderCircle size={16} className="animate-spin"/>A pesquisar fontes…</>:<><Search size={16}/>Iniciar pesquisa</>}</button></div>
    </form>
    {error&&<p role="alert" className="mt-4 rounded-xl border border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-800">{error}</p>}
    {notice&&!error&&<p role="status" className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">{notice}</p>}
    {result&&<section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Relatório de investigação</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">{result.title}</h2><p className="mt-2 text-xs text-zinc-500">{result.sources.length} fontes identificadas{result.researchedAt?" · "+new Date(result.researchedAt).toLocaleString():""}</p></div>
      <article className="whitespace-pre-wrap px-5 py-6 text-sm leading-7 text-zinc-700 sm:px-6">{result.content}</article>
      <div className="border-t border-zinc-200 p-5 sm:p-6"><h3 className="text-sm font-semibold text-zinc-950">Fontes para verificação</h3><ul className="mt-3 space-y-3">{result.sources.map((source,i)=><li key={source.url} className="flex items-start gap-3"><span className="mt-0.5 text-xs text-zinc-400">{String(i+1).padStart(2,"0")}</span><div className="min-w-0"><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-black">{source.title||source.url}<ExternalLink size={13} className="mt-1 shrink-0"/></a><p className="mt-1 break-all text-xs text-zinc-500">{source.url}</p></div></li>)}</ul></div>
      <div className="flex flex-wrap gap-3 border-t border-zinc-200 bg-zinc-50 p-5"><button onClick={useForWriting} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white">Usar no trabalho académico<ArrowRight size={15}/></button><button onClick={useForStudy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900">Usar no set up de estudos<ArrowRight size={15}/></button></div>
    </section>}
  </div>;
}
