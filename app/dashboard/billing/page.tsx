"use client";

import { useState } from "react";

const modules = ["Developer Studio", "Academic Workspace"];
const durations = [
  { id: "1", title: "Daily pass", period: "24 hours", price: 2 },
  { id: "7", title: "Weekly pass", period: "7 days", price: 5 },
  { id: "30", title: "Monthly pass", period: "30 days", price: 15 },
];

export default function BillingPage() {
  const [selected, setSelected] = useState<string[]>(["Developer Studio"]);
  const [duration, setDuration] = useState("30");
  const activeDuration = durations.find((item) => item.id === duration) ?? durations[2];
  const total = activeDuration.price * selected.length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">BluiSkill</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Billing</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">Transparent USD pricing for individual tools or full workspace access.</p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-800">Pay per use</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">$0.50 <span className="text-sm font-normal text-zinc-500">USD / generation</span></p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">One individual tool execution, such as Architect, Docs, Academic Paper or another supported generator.</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-800">Workspace passes</p>
          <p className="mt-3 text-sm leading-6 text-zinc-600">Choose daily, weekly or monthly access to each selected module.</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-800">
            {durations.map((item) => <li key={item.id} className="flex items-center justify-between gap-3"><span>{item.title} · {item.period}</span><strong>${item.price.toFixed(2)}</strong></li>)}
          </ul>
        </article>
      </section>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-950">Configure your pass</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">Select one or both workspaces and a duration. Prices are shown in USD.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {modules.map((module) => (
            <label key={module} className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800">
              <input type="checkbox" checked={selected.includes(module)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, module] : current.filter((item) => item !== module))} className="accent-black" />
              {module}
            </label>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium text-zinc-800">Access duration
          <select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm">
            {durations.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.period} · ${item.price.toFixed(2)}</option>)}
          </select>
        </label>
        <div className="mt-5 rounded-xl bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Indicative total</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950">${total.toFixed(2)} USD</p>
          <p className="mt-1 text-xs text-zinc-500">{selected.length} module(s) × ${activeDuration.price.toFixed(2)} per module.</p>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-200 p-4 text-sm leading-6 text-zinc-600">
          Online checkout is not enabled yet. These prices describe the intended plans only; no payment is taken from this page. Payment methods will be advertised only after merchant setup and verified test transactions.
        </div>
        <button disabled className="mt-4 w-full cursor-not-allowed rounded-xl bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-500">Checkout unavailable — payment setup required</button>
        <p className="mt-3 text-xs text-zinc-500">Support: support@bluiskill.com</p>
      </section>
    </div>
  );
}
