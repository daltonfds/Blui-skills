export function AdSlot() {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;
  return <aside aria-label="Publicidade" className="mx-auto my-4 w-full max-w-6xl px-4 sm:px-6">
    <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-3 text-center text-xs text-zinc-400">
      Espaço publicitário discreto
    </div>
  </aside>;
}
