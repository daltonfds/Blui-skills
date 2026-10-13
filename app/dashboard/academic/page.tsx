import Link from "next/link";
import { BookOpen, FileSearch, FileText, LibraryBig, ArrowUpRight } from "lucide-react";

const areas = [
  { href: "/dashboard/academic/research", number: "01", title: "Pesquisa aprofundada", description: "Investiga um tema com pesquisa na web, reúne fontes e organiza evidências antes de escrever.", action: "Abrir pesquisa", icon: FileSearch },
  { href: "/dashboard/academic/paper", number: "02", title: "Elaboração de trabalhos", description: "Transforma a pesquisa e os materiais fornecidos num documento estruturado com referências a verificar.", action: "Criar trabalho", icon: FileText },
  { href: "/dashboard/academic/study", number: "03", title: "Set up de estudos", description: "Cria sínteses, perguntas de prática e cartões de revisão espaçada a partir da mesma matéria.", action: "Organizar estudos", icon: BookOpen },
  { href: "/dashboard/academic/library", number: "04", title: "Biblioteca académica", description: "Volta a abrir pesquisas, trabalhos e sessões de estudo guardados na tua conta.", action: "Ver biblioteca", icon: LibraryBig },
];

export default function AcademicHome() {
  return <div className="mx-auto w-full max-w-6xl pb-12">
    <header className="border-b border-zinc-200 pb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">BluiSkill / Academic</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Academic</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">Um espaço de trabalho académico para pesquisar, escrever e estudar. Começa pela investigação e reutiliza o material nas etapas seguintes.</p>
    </header>
    <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Áreas académicas">
      {areas.map(({href,number,title,description,action,icon:Icon})=><Link key={href} href={href} className="group flex min-h-56 flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-500 sm:p-6">
        <div className="flex items-start justify-between"><span className="text-xs font-mono text-zinc-400">{number}</span><Icon size={20} strokeWidth={1.7} className="text-zinc-700"/></div>
        <h2 className="mt-6 text-lg font-semibold tracking-tight text-zinc-950">{title}</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-600">{description}</p>
        <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-zinc-950">{action}<ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></span>
      </Link>)}
    </section>
    <aside className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5"><p className="text-sm font-semibold text-zinc-900">Fluxo recomendado</p><p className="mt-1 text-sm leading-6 text-zinc-600">Pesquisa aprofundada → trabalho académico → set up de estudos. O material da pesquisa pode ser transferido para as outras áreas sem voltar a introduzir o conteúdo.</p></aside>
  </div>;
}
