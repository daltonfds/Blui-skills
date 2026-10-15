"use client";

import { Download, Image as ImageIcon } from "lucide-react";

type Phase = { title: string; goal: string; tasks?: string[]; acceptanceCriteria?: string[] };

export function RoadmapDiagram({ phases, canExport = true, onLocked }: { phases: Phase[]; canExport?: boolean; onLocked?: () => void }) {
  const ps = phases.slice(0, 8);
  const width = 900;
  const nodeHeight = 76;
  const gap = 34;
  const top = 28;
  const height = top * 2 + ps.length * nodeHeight + Math.max(0, ps.length - 1) * gap;
  const escape = (value: string) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
    return value.replace(/[&<>"]/g, (char) => entities[char] ?? char);
  };
  const svg = () => {
    const nodes = ps.map((phase, index) => {
      const y = top + index * (nodeHeight + gap);
      const connector = index
        ? '<path d="M450 ' + (y - gap) + ' V' + y + '" stroke="#18181b" stroke-width="1.5" fill="none"/><path d="M445 ' + (y - 7) + ' L450 ' + y + ' L455 ' + (y - 7) + '" stroke="#18181b" stroke-width="1.5" fill="none"/>'
        : "";
      return connector + '<rect x="110" y="' + y + '" width="680" height="' + nodeHeight + '" rx="8" fill="#ffffff" stroke="#a1a1aa" stroke-width="1.2"/><circle cx="140" cy="' + (y + 38) + '" r="14" fill="#18181b"/><text x="140" y="' + (y + 42) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">' + (index + 1) + '</text><text x="168" y="' + (y + 31) + '" font-size="16" font-weight="600" fill="#18181b">' + escape(phase.title.slice(0, 100)) + '</text><text x="168" y="' + (y + 53) + '" font-size="12" fill="#52525b">' + escape(phase.goal.slice(0, 130)) + "</text>";
    }).join("");
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '"><rect width="100%" height="100%" fill="#ffffff"/>' + nodes + "</svg>";
  };
  function downloadSvg() {
    if (!canExport) { onLocked?.(); return; }
    const url = URL.createObjectURL(new Blob([svg()], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bluiskill-roadmap.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  async function downloadPng() {
    if (!canExport) { onLocked?.(); return; }
    const url = URL.createObjectURL(new Blob([svg()], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const img = new window.Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("Could not render SVG")); });
      const canvas = document.createElement("canvas");
      canvas.width = width * 2; canvas.height = height * 2;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const anchor = document.createElement("a");
      anchor.href = canvas.toDataURL("image/png"); anchor.download = "bluiskill-roadmap.png"; anchor.click();
    } catch { downloadSvg(); }
    finally { URL.revokeObjectURL(url); }
  }
  if (!ps.length) return null;
  return (
    <section className="mb-5 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-sm font-semibold text-zinc-900">Roadmap diagram</h3><p className="mt-1 text-xs text-zinc-500">Technical, monochrome diagram · exportable SVG and PNG.</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void downloadPng()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"><ImageIcon size={14}/> Export PNG</button>
          <button type="button" onClick={downloadSvg} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"><Download size={14}/> Export SVG</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={"0 0 " + width + " " + height} className="min-w-[640px] w-full" role="img" aria-label="Roadmap phases diagram">
          <rect width={width} height={height} fill="#ffffff"/>
          {ps.map((phase, index) => { const y = top + index * (nodeHeight + gap); return <g key={phase.title + index}>
            {index > 0 && <><path d={"M450 " + (y - gap) + " V" + y} stroke="#18181b" strokeWidth="1.5" fill="none"/><path d={"M445 " + (y - 7) + " L450 " + y + " L455 " + (y - 7)} stroke="#18181b" strokeWidth="1.5" fill="none"/></>}
            <rect x="110" y={y} width="680" height={nodeHeight} rx="8" fill="#ffffff" stroke="#a1a1aa" strokeWidth="1.2"/>
            <circle cx="140" cy={y + 38} r="14" fill="#18181b"/><text x="140" y={y + 42} textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">{index + 1}</text>
            <text x="168" y={y + 31} fontSize="16" fontWeight="600" fill="#18181b">{phase.title.slice(0, 100)}</text>
            <text x="168" y={y + 53} fontSize="12" fill="#52525b">{phase.goal.slice(0, 130)}</text>
          </g>; })}
        </svg>
      </div>
    </section>
  );
}
