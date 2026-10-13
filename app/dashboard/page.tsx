"use client";

import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp, Check, ChevronDown, Clipboard, Code2, FileText,
  Plus, Sparkles, LoaderCircle, PanelLeftClose, PanelLeftOpen
} from "lucide-react";

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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: RoadmapResult;
};

const stacks = ["Next.js + Supabase", "React + Firebase", "Node.js + PostgreSQL", "Custom"];

function resultSummary(result: RoadmapResult) {
  return `I've prepared **${result.projectName || "your project"}**. Your plan includes a product requirements document, technical architecture, an implementation roadmap and a ready-to-use Master Prompt. Open the sections below to explore the details.`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [stack, setStack] = useState(stacks[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"prd" | "architecture" | "roadmap" | "prompt">("prd");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stackOpen, setStackOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestResult = [...messages].reverse().find((message) => message.result)?.result;

  function newChat() {
    setMessages([]);
    setIdea("");
    setError("");
    setCopied(false);
    setMenuOpen(false);
    textareaRef.current?.focus();
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = idea.trim();
    if (!text || busy) return;
    if (text.length < 20) {
      setError("Dá mais alguns detalhes à tua ideia (pelo menos 20 caracteres).");
      return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const previousContext = messages.map((message) =>
      `${message.role === "user" ? "User" : "Blui"}: ${message.content}`
    ).join("\n\n");
    const fullIdea = previousContext
      ? `Continue this project conversation. Use the previous context and update the project plan based on the latest request.\n\nPrevious conversation:\n${previousContext}\n\nLatest request:\n${text}${latestResult ? `\n\nCurrent project PRD:\n${latestResult.prd}\n\nCurrent architecture:\n${latestResult.architecture}\n\nCurrent roadmap:\n${JSON.stringify(latestResult.roadmap)}\n\nCurrent master prompt:\n${latestResult.masterPrompt}` : ""}`
      : text;

    setMessages((current) => [...current, userMessage]);
    setIdea("");
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: fullIdea, stack }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível gerar o plano. Tenta novamente.");

      const result = body.result as RoadmapResult;
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: resultSummary(result),
        result,
      }]);
      setActiveTab("prd");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro. Tenta novamente.");
    } finally {
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  async function copyText(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecciona o texto e copia manualmente.");
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!busy && idea.trim()) void sendMessage();
    }
  }

  return (
    <div className="relative -mx-5 -my-7 flex min-h-[100dvh] flex-col bg-white text-zinc-950 md:-mx-10 md:-my-10">
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 bg-white/95 px-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close menu" : "Open menu"} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-black">
            {menuOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
          </button>
          <span className="text-sm font-semibold tracking-tight">Blui</span>
          <span className="hidden rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:inline-flex">Architect</span>
        </div>
        <button type="button" onClick={newChat} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-black">
          <Plus size={16} /><span className="hidden sm:inline">Nova conversa</span><span className="sm:hidden">Novo</span>
        </button>
      </header>

      {menuOpen && (
        <button type="button" aria-label="Close menu overlay" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 cursor-default bg-black/20" />
      )}
      <aside className={`fixed bottom-0 left-0 top-14 z-40 flex w-[280px] flex-col border-r border-zinc-200 bg-zinc-50 p-3 transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button type="button" onClick={newChat} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm font-medium hover:bg-zinc-100">
          <Plus size={17} /> Nova conversa
        </button>
        <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Recentes</p>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="px-2 py-3 text-sm leading-6 text-zinc-500">As tuas conversas vão aparecer aqui enquanto trabalhas.</p>
          ) : (
            <button type="button" onClick={() => setMenuOpen(false)} className="w-full truncate rounded-lg bg-zinc-200/70 px-3 py-2.5 text-left text-sm text-zinc-800">
              {latestResult?.projectName || messages.find((message) => message.role === "user")?.content || "Projecto novo"}
            </button>
          )}
        </div>
        <div className="border-t border-zinc-200 px-2 py-3 text-xs leading-5 text-zinc-500">
          <p className="font-medium text-zinc-800">Blui Architect</p>
          <p>Transforma ideias em planos de construção.</p>
        </div>
      </aside>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-8 pt-16 text-center sm:pt-20">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <Sparkles size={23} strokeWidth={1.7} />
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">O que vamos construir?</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500 sm:text-base">
              Explica a tua ideia. O Blui ajuda-te a definir o produto, a arquitectura, as etapas de desenvolvimento e o prompt para começares a programar.
            </p>
            <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {[
                { title: "Criar uma aplicação SaaS", detail: "Transformar uma ideia num produto completo", icon: Sparkles, prompt: "Quero criar uma aplicação SaaS. Ajuda-me a definir os utilizadores, as funcionalidades principais, a arquitectura e um plano de lançamento." },
                { title: "Planear a arquitectura", detail: "Escolher tecnologias e estrutura", icon: Code2, prompt: "Ajuda-me a desenhar a arquitectura técnica de uma aplicação web escalável, incluindo frontend, backend, base de dados, autenticação e segurança." },
                { title: "Dividir o projecto em etapas", detail: "Saber o que desenvolver primeiro", icon: FileText, prompt: "Cria um roadmap de desenvolvimento por fases, com tarefas claras, dependências e critérios de aceitação para a minha ideia: " },
                { title: "Preparar um Master Prompt", detail: "Dar instruções claras ao teu coding AI", icon: Clipboard, prompt: "Cria um Master Prompt detalhado para construir a minha aplicação com um coding AI, incluindo regras de implementação, arquitectura, segurança e testes: " },
              ].map(({ title, detail, icon: Icon, prompt }) => (
                <button key={title} type="button" onClick={() => { setIdea(prompt); textareaRef.current?.focus(); }} className="rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-400 hover:bg-zinc-50">
                  <Icon size={17} className="mb-3 text-zinc-700" />
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">{detail}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-8 py-7 sm:py-10">
            {messages.map((message) => (
              <article key={message.id} className={message.role === "user" ? "flex justify-end" : "flex items-start gap-3 sm:gap-4"}>
                {message.role === "assistant" && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white"><Sparkles size={16} /></div>}
                <div className={message.role === "user" ? "max-w-[88%] rounded-3xl bg-zinc-100 px-4 py-3 text-sm leading-6 text-zinc-900 sm:max-w-[80%] sm:px-5" : "min-w-0 flex-1 pt-1"}>
                  {message.role === "user" ? message.content : (
                    <>
                      <p className="text-sm leading-7 text-zinc-800">{message.content}</p>
                      {message.result && (
                        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:px-5">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Plano do projecto</p>
                              <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">{message.result.projectName || "Projecto sem nome"}</h2>
                            </div>
                            <button type="button" onClick={() => void copyText(message.result!.masterPrompt)} className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800">
                              {copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copiado" : "Copiar Master Prompt"}
                            </button>
                          </div>
                          <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-2 sm:px-3" role="tablist" aria-label="Secções do plano">
                            {([
                              ["prd", "PRD"],
                              ["architecture", "Arquitectura"],
                              ["roadmap", "Roadmap"],
                              ["prompt", "Master Prompt"],
                            ] as const).map(([tab, label]) => (
                              <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => { setActiveTab(tab); setCopied(false); }} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-medium transition ${activeTab === tab ? "border-black text-black" : "border-transparent text-zinc-500 hover:text-black"}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="p-4 sm:p-5">
                            {activeTab === "prd" && <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-700">{message.result.prd}</pre>}
                            {activeTab === "architecture" && <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-700">{message.result.architecture}</pre>}
                            {activeTab === "roadmap" && (
                              <div className="space-y-2">
                                {(message.result.roadmap || []).map((phase, index) => (
                                  <details key={`${index}-${phase.title}`} open={index === 0} className="group rounded-xl border border-zinc-200">
                                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold">{String(index + 1).padStart(2, "0")}</span>
                                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{phase.title}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{phase.goal}</span></span>
                                      <ChevronDown size={15} className="text-zinc-500 transition group-open:rotate-180" />
                                    </summary>
                                    <div className="border-t border-zinc-100 px-4 py-4">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tarefas</p>
                                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-zinc-700">{phase.tasks.map((task, index) => <li key={index}>{task}</li>)}</ul>
                                      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Critérios de aceitação</p>
                                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-zinc-700">{phase.acceptanceCriteria.map((item, index) => <li key={index}>{item}</li>)}</ul>
                                    </div>
                                  </details>
                                ))}
                              </div>
                            )}
                            {activeTab === "prompt" && <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 font-mono text-xs leading-6 text-zinc-800">{message.result.masterPrompt}</pre>}
                            {activeTab !== "prompt" && <div className="mt-4 flex justify-end"><button type="button" onClick={() => void copyText(activeTab === "prd" ? message.result!.prd : activeTab === "architecture" ? message.result!.architecture : JSON.stringify(message.result!.roadmap, null, 2))} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-black">{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copiado" : "Copiar secção"}</button></div>}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            ))}
            {busy && <div className="flex items-start gap-3 text-sm text-zinc-500" role="status"><div className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200"><Sparkles size={16} /></div><LoaderCircle size={16} className="mt-2 animate-spin" /><span className="mt-1 leading-6">A analisar a tua ideia e a preparar o plano…</span></div>}
            <div />
          </div>
        )}

        <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-white via-white to-white/80 pb-2 pt-3">
          {error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p>}
          <form onSubmit={sendMessage} className="rounded-3xl border border-zinc-300 bg-white p-2 shadow-sm transition focus-within:border-zinc-400 focus-within:shadow-md">
            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(event) => { setIdea(event.target.value); if (error) setError(""); }}
              onKeyDown={onComposerKeyDown}
              rows={2}
              maxLength={12000}
              placeholder="Descreve o que queres construir…"
              aria-label="A tua mensagem para o Blui"
              className="max-h-52 min-h-[56px] w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-400"
            />
            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <div className="relative">
                <button type="button" onClick={() => setStackOpen((value) => !value)} className="flex max-w-[210px] items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-zinc-600 hover:bg-zinc-100" aria-expanded={stackOpen}>
                  <Code2 size={14} /><span className="truncate">{stack}</span><ChevronDown size={13} />
                </button>
                {stackOpen && <div className="absolute bottom-11 left-0 z-30 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">{stacks.map((option) => <button type="button" key={option} onClick={() => { setStack(option); setStackOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${stack === option ? "bg-zinc-100 font-semibold text-black" : "text-zinc-600 hover:bg-zinc-50"}`}>{option}</button>)}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-[11px] text-zinc-400 sm:inline">Enter para enviar · Shift + Enter para nova linha</span>
                <button type="submit" disabled={busy || !idea.trim()} aria-label="Enviar mensagem" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300">
                  {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowUp size={19} />}
                </button>
              </div>
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] leading-5 text-zinc-400">Cada geração de plano usa 1 crédito. Confirma sempre o código e as decisões técnicas antes de publicar.</p>
        </div>
      </main>
    </div>
  );
}
