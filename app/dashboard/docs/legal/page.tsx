"use client";

import { useState } from "react";
import { Download, FileText, ShieldCheck } from "lucide-react";

const inputClass = "mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:bg-white";

export default function LegalKitPage() {
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [email, setEmail] = useState("support@bluiskill.com");
  const [country, setCountry] = useState("South Africa");
  const [data, setData] = useState("Account details, email address, usage data, and content submitted by users");
  const [retention, setRetention] = useState("For as long as the account is active or as required by applicable law");
  const [selected, setSelected] = useState<"privacy" | "terms" | "cookies">("privacy");

  const name = company || "[LEGAL COMPANY NAME]";
  const url = site || "[WEBSITE URL]";
  const contact = email || "[CONTACT EMAIL]";

  const privacy = `# Privacy Policy — ${name}

**Last updated:** [DATE]

## Data controller
${name}, contact ${contact}, operates ${url}. Confirm the legal identity, registered address, and representative before publication.

## Data processed
${data}. Verify this list against the actual providers, records, and active product features.

## Purposes and legal basis
Data may be processed to create accounts, provide the service, protect the platform, process payments when enabled, and meet legal obligations. Identify the applicable legal basis for each purpose.

## Providers and international transfers
Identify the actual hosting, authentication, AI, analytics, and payment providers, their processing locations, and applicable safeguards.

## Retention
${retention}. Define retention periods for each data category and confirm any legal record-keeping obligations.

## Rights and contact
Depending on the laws applicable in ${country}, individuals may have rights to access, rectification, erasure, objection, portability, and lodging a complaint. Contact: ${contact}.

## Security and children
Describe only security measures that are actually implemented and state the real minimum-age policy.

**Notice:** This is an initial template, not legal advice. It does not guarantee compliance with GDPR, LGPD, or app-store requirements. Obtain legal review for the markets and actual data flows.`;

  const terms = `# Terms of Service — ${name}

**Last updated:** [DATE]

## Service
${name} provides software tools and AI-assisted generation at ${url}. Clearly disclose features, limits, credits, and prices before any purchase.

## Account and acceptable use
Users must provide accurate information, protect their credentials, and must not use the service to violate laws, infringe third-party rights, or compromise systems.

## AI-generated content
Outputs may contain errors, omissions, insecure code, or incorrect references. Users must review, test, and validate outputs before use. We do not guarantee accuracy, originality, fitness for a particular purpose, or academic/legal approval.

## Intellectual property and sources
Users are responsible for having the rights to submit materials and for respecting licences, confidentiality, and third-party rights.

## Payments and cancellations
Complete the actual billing, credit validity, renewal, refund, and cancellation terms before enabling payments.

## Governing law and contact
Jurisdiction and dispute resolution: [REVIEW WITH LEGAL COUNSEL]. Contact: ${contact}.

**Notice:** This is an initial template, not legal advice. It requires professional review in ${country} and in every market where the service operates.`;

  const cookies = `# Cookie Policy — ${name}

**Last updated:** [DATE]

The website ${url} should list only cookies and technologies actually in use.

- **Essential:** session, authentication, security, and necessary preferences.
- **Analytics:** [IDENTIFY TOOLS AND RETENTION PERIODS, IF ENABLED].
- **Marketing:** [IDENTIFY PROVIDERS, IF ENABLED].

Do not claim that cookies are active or inactive without auditing the website. Where required by law, obtain consent before enabling non-essential cookies and provide a clear way to withdraw consent.

## Suggested banner text
“We use essential cookies to keep the service secure. With your permission, we may use optional cookies for [PURPOSE]. You can accept, reject, or customise your choices. Read the Cookie Policy.”

Contact: ${contact}.

**Notice:** This is a working template, not legal advice. Confirm the applicable jurisdiction and actual technologies before publication.`;

  const docs = { privacy, terms, cookies };
  const labels = { privacy: "Privacy Policy", terms: "Terms of Service", cookies: "Cookie Policy & Consent" };

  function download() {
    const blob = new Blob([docs[selected]], { type: "text/markdown;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = labels[selected].toLowerCase().replace(/[^a-z]+/g, "-") + ".md";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck size={17} />
          <span className="text-xs font-semibold uppercase tracking-wider">Blui Docs · Legal & Compliance Kit</span>
        </div>
        <h1 className="mt-2 text-xl font-semibold sm:text-2xl">Legal document drafts</h1>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500 sm:text-sm sm:leading-6">Generate editable drafts. They have not been approved by a lawyer and do not guarantee compliance.</p>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-5">
        <section className="min-w-0 space-y-4 rounded-xl border border-zinc-200 bg-white p-3 sm:rounded-2xl sm:p-5">
          <label className="block text-xs font-medium">Legal company name<input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} placeholder="Entity name" /></label>
          <label className="block text-xs font-medium">Website<input value={site} onChange={(e) => setSite(e.target.value)} className={inputClass} placeholder="https://..." /></label>
          <label className="block text-xs font-medium">Contact email<input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium">Primary jurisdiction<input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium">Data categories<textarea rows={3} value={data} onChange={(e) => setData(e.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium">Retention period<textarea rows={2} value={retention} onChange={(e) => setRetention(e.target.value)} className={inputClass} /></label>
          <button onClick={download} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"><Download size={15} /> Download .md</button>
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:rounded-2xl">
          <div className="flex flex-wrap gap-1 border-b border-zinc-200 p-2">
            {Object.entries(labels).map(([id, label]) => (
              <button key={id} onClick={() => setSelected(id as typeof selected)} className={"rounded-lg px-3 py-2 text-xs font-medium " + (selected === id ? "bg-blue-50 text-blue-700" : "text-zinc-500 hover:bg-zinc-50")}>{label}</button>
            ))}
          </div>
          <div className="border-b border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Verify providers, legal bases, retention periods, jurisdictions, and user rights before publication.</div>
          <pre className="max-h-[760px] overflow-auto whitespace-pre-wrap break-words p-3 text-[13px] leading-5 text-zinc-700 sm:p-5 sm:text-sm sm:leading-6">{docs[selected]}</pre>
        </section>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><FileText size={14} /> Documents are generated in your browser; they are not saved or sent to third parties.</p>
    </div>
  );
}
