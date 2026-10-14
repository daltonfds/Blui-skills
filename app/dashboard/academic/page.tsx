"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, FileSearch, FileText, LibraryBig, Search } from "lucide-react";

type Objective = "research" | "paper" | "study";
const objectives: Array<{ value: Objective; label: string; description: string }> = [
  { value: "research", label: "Pesquisa aprofundada", description: "Investigar na web, comparar evidências e reunir fontes verificáveis." },
  { value: "paper", label: "Elaboração de trabalhos", description: "Estruturar um trabalho académico a partir do tema e das fontes." },
  { value: "study", label: "Organizar estudos", description: "Criar sínteses, perguntas de prática e cartões de revisão." },
];

export default function AcademicHome() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [objective, setObjective] = useState<Objective>("research");
  const [language, setLanguage] = useState("Português");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = prompt.trim();
    if (value.length < 8) {
      setError("Escreve um tema ou uma pergunta com pelo menos 8 caracteres.");
      return;
    }
    const target = objective === "research" ? "/dashboard/academic/research" : objective === "paper" ? "/dashboard/academic/paper" : "/dashboard/academic/study";
    const params = new URLSearchParams({ prompt: value, language });
    router.push(target + "?" + params.toString());
  }

  return <div className="mx-auto w-full max-w-4xl pb-10 sm:pb-14">
    <header className="pt-3 text-center sm:pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">BluiSkill / Academic</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Em que estás a trabalhar?</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">Pesquisa, escreve e estuda num único espaço. Começa com uma pergunta e escolhe o que queres fazer com ela.</p>
    </header>

    <form onSubmit={submit} className="mt-7 rounded-2xl border border-zinc-300 bg-white p-3 shadow-sm sm:mt-9 sm:p-5">
      <label htmlFor="academic-prompt" className="sr-only">Tema ou pergunta</label>
      <textarea id="academic-prompt" value={prompt} onChange={event => { setPrompt(event.target.value); setError(""); }} rows={4} maxLength={4000} placeholder="Escreve uma pergunta, descreve o tema ou explica o que precisas de descobrir…" className="min-h-32 w-full resize-y rounded-xl border-0 bg-transparent px-2 py-3 text-base leading-7 text-zinc-950 outline-none placeholder:text-zinc-400 focus:ring-0 sm:min-h-36 sm:px-3" />
      <div className="mt-2 grid gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(160px,auto)] sm:items-end">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-600">Objetivo
            <select value={objective} onChange={event => setObjective(event.target.value as Objective)} className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white">
              {objectives.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-600">Idioma
            <select value={language} onChange={event => setLanguage(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white">
              <option>Português</option><option>English</option><option>Español</option><option>Français</option>
            </select>
          </label>
        </div>
        <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto">
          <Search size={16} /> Continuar <ArrowUpRight size={16} />
        </button>
      </div>
      {error && <p role="alert" className="px-2 pt-2 text-sm text-zinc-700">{error}</p>}
      <p className="px-2 pb-1 pt-3 text-xs leading-5 text-zinc-500">{objectives.find(item => item.value === objective)?.description}</p>
    </form>

    <section className="mt-8 sm:mt-10" aria-label="Áreas académicas">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900">Também podes abrir directamente</h2><span className="text-xs text-zinc-500">O teu espaço de trabalho</span></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/academic/research" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100"><FileSearch size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Pesquisa aprofundada</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Investiga com fontes na web</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
        <Link href="/dashboard/academic/paper" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100"><FileText size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Trabalhos académicos</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Organiza um documento estruturado</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
        <Link href="/dashboard/academic/study" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100"><BookOpen size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Estudos e revisão</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Sintetiza e testa o que aprendeste</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
        <Link href="/dashboard/academic/library" className="flex min-h-20 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-500"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100"><LibraryBig size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">Biblioteca académica</span><span className="mt-1 block text-xs leading-5 text-zinc-600">Retoma os materiais guardados</span></span><ArrowUpRight size={16} className="shrink-0 text-zinc-500"/></Link>
      </div>
    </section>
    <p className="mt-6 text-center text-xs leading-5 text-zinc-500">Verifica sempre as fontes, os dados e as normas da tua instituição antes de entregar um trabalho.</p>
  </div>;
}
