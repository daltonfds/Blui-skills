"use client";

import { useEffect, useState } from "react";
import { Check, Globe2, Smartphone, WalletCards, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Currency = "USD" | "MZN" | "BRL" | "ZAR";
type TierKey = "single" | "daily" | "weekly" | "monthly";
type CountryGroup = "international" | "mozambique" | "brazil" | "south-africa";

const PRICING_TIERS: Record<Currency, Record<TierKey, number>> = {
  USD: { single: 0.49, daily: 0.99, weekly: 1.99, monthly: 4.99 },
  MZN: { single: 29, daily: 69, weekly: 129, monthly: 299 },
  BRL: { single: 2.49, daily: 4.9, weekly: 9.9, monthly: 24.9 },
  ZAR: { single: 7.99, daily: 14.99, weekly: 29.99, monthly: 79.99 },
};

const PLANS: Array<{ id: TierKey; title: string; duration: string; detail: string }> = [
  { id: "single", title: "Avulso", duration: "1 geração", detail: "Para uma tarefa pontual" },
  { id: "daily", title: "Passe Diário", duration: "24 horas", detail: "Acesso durante 24 horas" },
  { id: "weekly", title: "Passe Semanal", duration: "7 dias", detail: "Acesso durante 7 dias" },
  { id: "monthly", title: "Passe Mensal", duration: "30 dias", detail: "Acesso durante 30 dias" },
];

function countryGroup(value: unknown): CountryGroup {
  const country = typeof value === "string" ? value.trim().toLowerCase().replaceAll("_", " ").replaceAll("-", " ") : "";
  if (["mozambique", "moçambique", "moz", "mz"].includes(country)) return "mozambique";
  if (["brazil", "brasil", "br"].includes(country)) return "brazil";
  if (["south africa", "áfrica do sul", "africa do sul", "za"].includes(country)) return "south-africa";
  return "international";
}

function formatPrice(amount: number, currency: Currency) {
  if (currency === "MZN") return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} MT`;
  if (currency === "BRL") return `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "ZAR") return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BillingPage() {
  const [country, setCountry] = useState<CountryGroup>("international");
  const [selectedPlan, setSelectedPlan] = useState<TierKey>("monthly");
  const [profileLoaded, setProfileLoaded] = useState(false);

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
  const countryLabel = country === "mozambique" ? "Moçambique" : country === "brazil" ? "Brasil" : country === "south-africa" ? "África do Sul" : "Internacional";
  const paymentBadges = currency === "MZN"
    ? [{ label: "M-Pesa", icon: Smartphone }, { label: "eMola", icon: WalletCards }]
    : currency === "BRL"
      ? [{ label: "PIX", icon: Smartphone }]
      : currency === "ZAR"
        ? [{ label: "Cartão", icon: CreditCard }]
        : [{ label: "Cartão internacional", icon: CreditCard }];

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">BLUISKILL · FATURAÇÃO</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Escolha o seu plano</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Preços simples para uma geração ou acesso por período. Os valores acompanham o país guardado no seu perfil.</p>
      </header>

      <section className="mt-7 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Globe2 size={18} className="text-blue-600"/><h2 className="font-semibold text-zinc-950">Preços locais</h2></div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{profileLoaded ? countryLabel : "A detetar país…"} · {currency}</span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">Selecione um plano para o destacar. A moeda é definida pelo país do seu perfil.</p>
      </section>

      <section className="mt-5 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Planos disponíveis">
        {PLANS.map((plan) => {
          const selected = selectedPlan === plan.id;
          const monthly = plan.id === "monthly";
          return (
            <article key={plan.id} className={"relative flex min-w-0 flex-col rounded-2xl border bg-white p-5 transition " + (monthly ? "border-2 border-[#3B82F6] shadow-[0_8px_28px_rgba(59,130,246,0.10)]" : selected ? "border-blue-500 ring-2 ring-blue-500/10" : "border-zinc-200")}>
              {monthly && <span className="absolute -top-3 left-4 rounded-full bg-[#3B82F6] px-3 py-1 text-[11px] font-semibold text-white">Melhor valor</span>}
              <div className="flex min-h-14 items-start justify-between gap-2 pt-1">
                <div><h2 className="text-base font-semibold text-zinc-950">{plan.title}</h2><p className="mt-1 text-xs text-zinc-500">{plan.duration}</p></div>
                {selected && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Check size={15}/></span>}
              </div>
              <p className="mt-5 whitespace-nowrap text-3xl font-bold tracking-tight text-zinc-950">{formatPrice(PRICING_TIERS[currency][plan.id], currency)}</p>
              <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-600">{plan.detail}</p>
              <div className="mt-4 flex min-h-8 flex-wrap gap-2">
                {paymentBadges.map(({ label, icon: Icon }) => <span key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700"><Icon size={13}/>{label}</span>)}
              </div>
              <button type="button" aria-pressed={selected} onClick={() => setSelectedPlan(plan.id)} className={"mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " + (selected ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-600 text-white hover:bg-blue-700")}>
                {selected ? <><Check size={16}/>Plano selecionado</> : "Selecionar Plano"}
              </button>
            </article>
          );
        })}
      </section>

      <p className="mt-5 text-xs leading-5 text-zinc-500">Os métodos de pagamento apresentados indicam as opções locais pretendidas. A seleção de um plano não efetua uma cobrança; o processamento de pagamentos deve estar ativo antes de concluir uma compra.</p>
    </div>
  );
}
