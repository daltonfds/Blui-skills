"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, Globe2, Smartphone, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Currency = "USD" | "MZN" | "BRL" | "ZAR";
type TierKey = "single" | "daily" | "weekly" | "monthly";
type CountryGroup = "international" | "mozambique" | "brazil" | "south-africa";

const PRICING_TIERS: Record<Currency, Record<TierKey, number>> = {
  USD: { single: 0.49, daily: 0.99, weekly: 1.99, monthly: 4.99 },
  MZN: { single: 29.00, daily: 69.00, weekly: 129.00, monthly: 299.00 },
  BRL: { single: 2.49, daily: 4.90, weekly: 9.90, monthly: 24.90 },
  ZAR: { single: 7.99, daily: 14.99, weekly: 29.99, monthly: 79.99 },
};

const PLANS: Array<{ id: TierKey; title: string; description: string }> = [
  { id: "single", title: "Single use", description: "One generation" },
  { id: "daily", title: "Daily pass", description: "24-hour access" },
  { id: "weekly", title: "Weekly pass", description: "7-day access" },
  { id: "monthly", title: "Monthly pass", description: "30-day access" },
];

const MODULES = [
  { id: "developer", title: "Developer Studio", description: "Architecture, prompts, documentation and security reviews." },
  { id: "academic", title: "Academic Workspace", description: "Deep Research, academic writing, study guides and revision cards." },
  { id: "complete", title: "Complete Workspace", description: "Access to both Developer Studio and Academic Workspace." },
];

function countryGroup(value: unknown): CountryGroup {
  const country = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["mozambique", "moçambique", "moz", "mz"].includes(country)) return "mozambique";
  if (["brazil", "brasil", "br"].includes(country)) return "brazil";
  if (["south africa", "south-africa", "south_africa", "áfrica do sul", "africa do sul", "za"].includes(country)) return "south-africa";
  return "international";
}

function formatPrice(amount: number, currency: Currency) {
  if (currency === "MZN") return `${amount.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
  if (currency === "BRL") return `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "ZAR") return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BillingPage() {
  const [country, setCountry] = useState<CountryGroup>("international");
  const [selectedPlan, setSelectedPlan] = useState<TierKey>("monthly");
  const [selectedModule, setSelectedModule] = useState("complete");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCountry() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
          if (active) setCountry(countryGroup(profile?.country ?? user.user_metadata?.country));
        } else if (typeof navigator !== "undefined") {
          const locale = navigator.language.toLowerCase();
          if (locale.endsWith("-mz")) setCountry("mozambique");
          else if (locale.endsWith("-br")) setCountry("brazil");
          else if (locale.endsWith("-za")) setCountry("south-africa");
        }
      } catch (error) {
        console.error("Could not load billing country", error);
      } finally {
        if (active) setProfileLoaded(true);
      }
    }
    void loadCountry();
    return () => { active = false; };
  }, []);

  const currency: Currency = country === "mozambique" ? "MZN" : country === "brazil" ? "BRL" : country === "south-africa" ? "ZAR" : "USD";
  const selectedPrice = PRICING_TIERS[currency][selectedPlan];
  const selectedModuleInfo = MODULES.find((item) => item.id === selectedModule) ?? MODULES[2];
  const countryLabel = country === "mozambique" ? "Mozambique" : country === "brazil" ? "Brazil" : country === "south-africa" ? "South Africa" : "International";
  const paymentMethods = useMemo(() => {
    if (currency === "MZN") return [{ label: "M-Pesa", icon: Smartphone }, { label: "eMola", icon: WalletCards }];
    if (currency === "BRL") return [{ label: "PIX", icon: Smartphone }];
    return [{ label: "Credit / debit cards", icon: CreditCard }];
  }, [currency]);

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">BLUISKILL · PRICING</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Choose the right access for your work</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Straightforward pricing for individual generations or time-based access. Prices adapt to your saved country.</p>
      </header>

      <section className="mt-7 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Globe2 size={18} className="text-blue-600"/><h2 className="font-semibold text-zinc-950">Local pricing</h2></div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{profileLoaded ? countryLabel : "Detecting country…"} · {currency}</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const active = selectedPlan === plan.id;
            return <button key={plan.id} type="button" aria-pressed={active} onClick={() => { setSelectedPlan(plan.id); setCheckoutNotice(false); }} className={`rounded-xl border p-4 text-left transition focus-visible:outline-blue-600 ${active ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/15" : "border-zinc-200 bg-white hover:border-zinc-400"}`}>
              <span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold text-zinc-900">{plan.title}</span>{active && <Check size={16} className="text-blue-700"/>}</span>
              <span className="mt-3 block text-2xl font-bold tracking-tight text-zinc-950">{formatPrice(PRICING_TIERS[currency][plan.id], currency)}</span>
              <span className="mt-1 block text-xs text-zinc-500">{plan.description}</span>
            </button>;
          })}
        </div>
        <p className="mt-4 text-xs text-zinc-500">All prices are displayed in the currency associated with your profile. International users see USD.</p>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-950">Choose your workspace</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">Select the tools you want to access with this plan.</p>
          <div className="mt-4 space-y-3">
            {MODULES.map((module) => <button key={module.id} type="button" aria-pressed={selectedModule === module.id} onClick={() => { setSelectedModule(module.id); setCheckoutNotice(false); }} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${selectedModule === module.id ? "border-blue-600 bg-blue-50/60" : "border-zinc-200 hover:border-zinc-400"}`}>
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${selectedModule === module.id ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 text-transparent"}`}><Check size={13}/></span>
              <span><span className="block text-sm font-semibold text-zinc-950">{module.title}</span><span className="mt-1 block text-xs leading-5 text-zinc-600">{module.description}</span></span>
            </button>)}
          </div>
        </article>

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-950">Your selection</h2>
          <p className="mt-1 text-sm text-zinc-500">{selectedModuleInfo.title} · {PLANS.find((item) => item.id === selectedPlan)?.title}</p>
          <p className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">{formatPrice(selectedPrice, currency)}</p>
          <p className="mt-1 text-xs text-zinc-500">{PLANS.find((item) => item.id === selectedPlan)?.description}</p>
          <div className="mt-5 border-t border-zinc-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Payment options for {countryLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentMethods.map(({ label, icon: Icon }) => <span key={label} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700"><Icon size={14}/>{label}</span>)}
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">Payment providers are not connected yet. These are the intended local options; no payment will be taken.</p>
          </div>
          <button type="button" onClick={() => setCheckoutNotice(true)} className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Continue with this plan</button>
          {checkoutNotice && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">Your selection is ready, but secure checkout has not been activated yet. No charge has been made. Payment integration is required before subscriptions can be purchased.</p>}
          <p className="mt-4 text-xs text-zinc-500">Need help? <a className="underline underline-offset-4 hover:text-blue-700" href="mailto:support@bluiskill.com">support@bluiskill.com</a></p>
        </aside>
      </section>
    </div>
  );
}
