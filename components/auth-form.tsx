"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const SITE_URL = "https://blui.online";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const signup = mode === "signup";

  function safeNext() {
    const next = params.get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const sb = createClient();
      if (signup) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, country }, emailRedirectTo: `${SITE_URL}/auth/callback?next=%2Fdashboard` },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Check your inbox to confirm your email and finish creating your account.");
          return;
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push(safeNext());
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }
    setBusy(true);
    setMessage("");
    setMagicLinkSent(false);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(safeNext())}` },
      });
      if (error) throw error;
      setMagicLinkSent(true);
      setMessage("If this email is registered, a secure sign-in link will arrive shortly. Check your inbox.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send a sign-in link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {signup && <>
        <label className="block text-sm text-zinc-800">Full name<input required value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-zinc-950 placeholder:text-zinc-400 focus:border-blue-600 focus:bg-white focus:outline-none" /></label>
        <label className="block text-sm text-zinc-800">Country<select required value={country} onChange={e => setCountry(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-zinc-950 focus:border-blue-600 focus:bg-white focus:outline-none"><option value="">Choose your country</option>{["Mozambique", "South Africa", "Brazil", "France", "United States", "United Kingdom", "Portugal", "Angola", "Nigeria", "Kenya", "India", "Other"].map(c => <option key={c} value={c}>{c}</option>)}</select><span className="mt-1 block text-xs text-zinc-500">Used to display local pricing and payment options.</span></label>
      </>}
      <label className="block text-sm text-zinc-800">Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 focus:border-blue-600 focus:outline-none" /></label>
      <label className="block text-sm text-zinc-800">Password<input required={!signup} minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 focus:border-blue-600 focus:outline-none" /></label>
      {message && <p role="status" aria-live="polite" className={`rounded-lg border p-3 text-sm ${magicLinkSent ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-zinc-50 text-zinc-700"}`}>{message}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60">{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
      {!signup && <button type="button" disabled={busy} onClick={() => void sendMagicLink()} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:border-blue-600 hover:text-blue-700 disabled:opacity-60">{busy ? "Sending…" : "Email me a sign-in link"}</button>}
      <p className="text-center text-sm text-zinc-600">{signup ? "Already have an account?" : "New to BluiSkill?"} <Link className="font-medium text-blue-700 hover:underline" href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p>
    </form>
  );
}
