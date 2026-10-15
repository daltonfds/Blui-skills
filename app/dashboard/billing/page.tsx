"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const modules = ["Developer Studio", "Academic Workspace"] as const;
type CountryGroup = "international" | "mozambique" | "brazil" | "south-africa";

const pricing: Record<CountryGroup, {
  currency: string;
  locale: string;
  countryLabel: string;
  prices: { id: string; title: string; period: string; price: number }[];
}> = {
  international: {
    currency: "USD", locale: "en-US", countryLabel: "International",
    prices: [
      { id: "use", title: "Pay per use", period: "one generation", price: 0.49 },
      { id: "1", title: "Daily pass", period: "24 hours", price: 1.99 },
      { id: "7", title: "Weekly pass", period: "7 days", price: 4.99 },
      { id: "30", title: "Monthly pass", period: "30 days", price: 14.99 },
    ],
  },
  mozambique: {
    currency: "MZN", locale: "pt-MZ", countryLabel: "Moçambique",
    prices: [
      { id: "use", title: "Avulso", period: "uma geração", price: 29 },
      { id: "1", title: "Passe diário", period: "24 horas", price: 129 },
      { id: "7", title: "Passe semanal", period: "7 dias", price: 299 },
      { id: "30", title: "Passe mensal", period: "30 dias", price: 890 },
    ],
  },
  brazil: {
    currency: "BRL", locale: "pt-BR", countryLabel: "Brasil",
    prices: [
      { id: "use", title: "Avulso", period: "uma geração", price: 2.49 },
      { id: "1", title: "Passe diário", period: "24 horas", price: 9.9 },
      { id: "7", title: "Passe semanal", period: "7 dias", price: 24.9 },
      { id: "30", title: "Passe mensal", period: "30 dias", price: 69.9 },
    ],
  },
  "south-africa": {
    currency: "ZAR", locale: "en-ZA", countryLabel: "South Africa",
    prices: [
      { id: "use", title: "Pay per use", period: "one generation", price: 7.99 },
      { id: "1", title: "Daily pass", period: "24 hours", price: 29.99 },
      { id: "7", title: "Weekly pass", period: "7 days", price: 79.99 },
      { id: "30", title: "Monthly pass", period: "30 days", price: 239.99 },
    ],
  },
};

function countryGroup(country: unknown): CountryGroup {
  const normalized = typeof country === "string" ? country.trim().toLowerCase() : "";
  if (["mozambique", "moçambique", "moz"].includes(normalized)) return "mozambique";
  if (["brazil", "brasil", "br"].includes(normalized)) return "brazil";
  if (["south africa", "south-africa", "áfrica do sul", "africa do sul", "za"].includes(normalized)) return "south-africa";
  return "international";
}

function formatPrice(value: number, group: CountryGroup): string {
  if (group === "mozambique") return `${value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
  if (group === "brazil") return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (group === "south-africa") return `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BillingPage() {
  const [selected, setSelected] = useState<string[]>(["Developer Studio"]);
  const [duration, setDuration] = useState("30");
  const [group, setGroup] = useState<CountryGroup>("international");
  const [countryLoaded, setCountryLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCountry() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!active || !user) {
          if (active) setCountryLoaded(true);
          return;
        }
        const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
        const country = profile?.country ?? user.user_metadata?.country;
        if (active) setGroup(countryGroup(country));
      } catch (error) {
        console.error("Could not load billing country", error);
      } finally {
        if (active) setCountryLoaded(true);
      }
    }
    void loadCountry();
    return () => { active = false; };
  }, []);

  const plan = pricing[group];
  const activeDuration = plan.prices.find((item) => item.id === duration) ?? plan.prices[3];
  const total = activeDuration.price * selected.length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">BluiSkill</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Billing</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">Pricing adapts to the country saved in your profile.</p>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-zinc-950">Prices for {plan.countryLabel}</h2>
            <p className="mt-1 text-sm text-zinc-500">{countryLoaded ? `Currency: ${plan.currency}` : "Loading profile currency…"}</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{plan.currency}</span>
        </div>
        <div className="mt-4 divide-y divide-zinc-100">
          {plan.prices.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{item.period}</p>
              </div>
              <strong className="whitespace-nowrap text-base font-semibold text-zinc-950">{formatPrice(item.price, group)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-950">Configure your pass</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">Select one or both workspaces and a duration. Prices use your profile country.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {modules.map((module) => (
            <label key={module} className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800">
              <input type="checkbox" checked={selected.includes(module)} onChange={(event) => setSelected((current) => event.target.checked ? [...current.filter((item) => item !== module), module] : current.filter((item) => item !== module))} className="accent-black" />
              {module}
            </label>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium text-zinc-800">Access option
          <select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm">
            {plan.prices.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.period} · {formatPrice(item.price, group)}</option>)}
          </select>
        </label>
        <div className="mt-5 rounded-xl bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Indicative total</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950">{formatPrice(total, group)}</p>
          <p className="mt-1 text-xs text-zinc-500">{selected.length} module(s) × {formatPrice(activeDuration.price, group)} per module.</p>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-200 p-4 text-sm leading-6 text-zinc-600">
          Online checkout is not enabled yet. These are the intended prices only; no payment is taken from this page. Payment methods will be advertised only after merchant setup and verified test transactions.
        </div>
        <button disabled className="mt-4 w-full cursor-not-allowed rounded-xl bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-500">Checkout unavailable — payment setup required</button>
        <p className="mt-3 text-xs text-zinc-500">Support: support@bluiskill.com</p>
      </section>
    </div>
  );
}
