import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const SYSTEM = `You are Blui Academic Master, a careful academic writing and study assistant. Write in a formal, impersonal academic style in the requested output language. If the language is Auto-detect, infer the language from the user topic and supplied source text, then use that language consistently. Avoid stock AI clichés. Use only the supplied source and metadata as evidence. Never invent quotations, page numbers, authors, publication dates, DOIs or bibliographic references. If source metadata is missing, flag it as [BIBLIOGRAPHIC DETAILS TO VERIFY]. Distinguish the user's source from verified external research: no web research tool is available in this request, so do not claim to have performed external research. Return valid JSON only.
For mode paper return {"title":"...","content":"complete Markdown document","referencesNote":"..."} with cover, title page, table of contents with section headings (do not invent page numbers), introduction, general and specific objectives, methodology/source analysis, detailed theory/development with traceable citations from source, conclusion, and references. Follow requested ABNT or APA style as closely as possible while noting that final institutional formatting should be checked.
For mode study return {"title":"...","summary":"...","cards":[{"topic":"...","question":"...","answer":"...","options":["A...","B...","C...","D..."],"type":"multiple_choice|open_question|flashcard"}]} with 8–16 source-grounded cards including a mix of quizzes, open questions and flashcards. For multiple choice, exactly one option must be correct and explain why in answer. No unsupported facts.`;

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function validOutput(value: unknown, mode: string): boolean {
  if (!isRecord(value) || typeof value.title !== "string") return false;
  if (mode === "paper") return typeof value.content === "string" && value.content.length >= 300;
  return typeof value.summary === "string" && Array.isArray(value.cards) && value.cards.length >= 4 &&
    value.cards.every((card) => isRecord(card) && typeof card.question === "string" && typeof card.answer === "string");
}
async function fetchWithRetry(url: string, makeInit: () => RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, makeInit());
      if (![500, 502, 503, 504].includes(response.status) || attempt === 2) return response;
      await response.body?.cancel().catch(() => undefined);
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini service is temporarily unavailable.");
}

async function generate(input: Record<string, unknown>, pdf?: File) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key is not configured. Add GEMINI_API_KEY to the Vercel environment.");
  // Force a supported Gemini model to avoid stale or invalid model names returning HTTP 404.
  const model = "gemini-3.8-flash";
  const parts: Array<Record<string, unknown>> = [{ text: JSON.stringify(input) }];
  if (pdf) parts.push({ inlineData: { mimeType: "application/pdf", data: Buffer.from(await pdf.arrayBuffer()).toString("base64") } });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const payload = JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 8192 } });
  const response = await fetchWithRetry(url, () => ({
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: payload, cache: "no-store", signal: AbortSignal.timeout(16_000),
  }));
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Academic Gemini request failed", { status: response.status, detail: detail.slice(0,300) });
    if (response.status === 429) throw new Error("The Gemini API rate limit was reached. Please try again later.");
    throw new Error(response.status === 404 ? "Gemini model or endpoint not found (HTTP 404). Check the selected model and API access." : response.status === 401 || response.status === 403 ? "The Gemini API key is invalid or lacks permission. Check GEMINI_API_KEY." : `Gemini API request failed (HTTP ${response.status}) after retries. Please try again later.`);
  }
  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.map((part: {text?: string}) => part.text || "").join("");
  if (!raw) throw new Error("The model returned no result. Please try again.");
  try { return JSON.parse(raw) as unknown; } catch { throw new Error("The model returned an invalid format. Please try again."); }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const [{ data: generations, error: historyError }, { data: cards, error: cardsError }, { data: profile }] = await Promise.all([
    supabase.from("academic_generations").select("id,mode,title,output_data,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("academic_study_cards").select("id,generation_id,topic,question,answer,options,card_type,interval_step,due_at").eq("user_id", user.id).lte("due_at", new Date().toISOString()).order("due_at").limit(50),
    supabase.from("profiles").select("credits,plan_type,pass_expires_at").eq("id", user.id).maybeSingle(),
  ]);
  if (historyError || cardsError) return NextResponse.json({ error: "Apply the Academic Supabase migration before using this module." }, { status: 503 });
  return NextResponse.json({ generations: generations ?? [], dueCards: cards ?? [], credits: profile?.credits ?? null });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  try {
    const form = await request.formData();
    const mode = String(form.get("mode") || "");
    if (mode !== "paper" && mode !== "study") return NextResponse.json({ error: "Invalid generation mode." }, { status: 400 });
    const topic = String(form.get("topic") || "").trim();
    const sourceText = String(form.get("sourceText") || "").trim();
    const pdfEntry = form.get("pdf");
    const pdf = pdfEntry instanceof File && pdfEntry.size > 0 ? pdfEntry : undefined;
    if (topic.length < 8 || topic.length > 4000) return NextResponse.json({ error: "Enter a topic between 8 and 4,000 characters." }, { status: 400 });
    if (sourceText.length > 55000) return NextResponse.json({ error: "The source text exceeds 55,000 characters." }, { status: 413 });
    if (pdf && (pdf.type !== "application/pdf" || pdf.size > MAX_PDF_BYTES)) return NextResponse.json({ error: "The file must be a PDF no larger than 8 MB." }, { status: 400 });
    if (!sourceText && !pdf) return NextResponse.json({ error: "Paste source text or upload a PDF." }, { status: 400 });
    const outputLanguageRaw = String(form.get("language") || "Auto-detect");
    const outputLanguage = ["Auto-detect","English","Português","Español","Français"].includes(outputLanguageRaw) ? outputLanguageRaw : "Auto-detect";
    const metadata = {
      institution: String(form.get("institution") || "").slice(0,200),
      student: String(form.get("student") || "").slice(0,160),
      course: String(form.get("course") || "").slice(0,160),
      discipline: String(form.get("discipline") || "").slice(0,160),
      professor: String(form.get("professor") || "").slice(0,160),
      city: String(form.get("city") || "").slice(0,120),
      date: String(form.get("date") || "").slice(0,40),
      style: String(form.get("style") || "ABNT"),
    };
    const { data: profile, error: profileError } = await supabase.from("profiles").select("credits,plan_type,pass_expires_at").eq("id",user.id).maybeSingle();
    if (profileError || !profile) return NextResponse.json({ error: "Could not verify your credits." }, { status: 503 });
    const hasActivePass = ["daily_pass", "weekly_pass", "monthly_pass"].includes(profile.plan_type) && !!profile.pass_expires_at && new Date(profile.pass_expires_at).getTime() > Date.now();
    if (profile.credits < 1 && !hasActivePass) return NextResponse.json({ error: "You do not have enough credits. Add credits or activate a pass to continue." }, { status: 402 });
    const input = { mode, topic, sourceText, sourceFileName: pdf?.name || null, metadata, style: metadata.style, language: outputLanguage,
      instructions: mode === "paper" ? "Cria um trabalho académico completo em Markdown, usando apenas citações verificáveis da fonte fornecida." : "Cria resumo, perguntas de escolha múltipla, perguntas abertas e flashcards para revisão espaçada." };
    const generated = await generate(input, pdf);
    if (!validOutput(generated, mode)) return NextResponse.json({ error: "O resultado ficou incompleto. Nenhum crédito foi usado; tenta novamente." }, { status: 502 });
    const title = String((generated as Record<string, unknown>).title || topic).slice(0,160);
    const cards = mode === "study" ? (generated as Record<string, unknown>).cards as unknown[] : [];
    const { data: generationId, error: saveError } = await supabase.rpc("create_academic_generation", {
      p_mode: mode, p_title: title, p_input_data: { ...input, sourceText: sourceText.slice(0,55000), sourceFileName: pdf?.name || null },
      p_output_data: generated, p_cards: cards,
    });
    if (saveError) {
      console.error("Academic save failed", saveError.message);
      if (/insufficient credits|no credits/i.test(saveError.message)) return NextResponse.json({ error: "Your credits have run out. Refresh your balance and try again." }, { status: 402 });
      return NextResponse.json({ error: "The result was generated but could not be saved. Check the Academic Supabase migration; no credit was deducted." }, { status: 503 });
    }
    return NextResponse.json({ id: generationId, result: generated, mode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ success: false, error: /timeout|abort/i.test(message) ? "Generation took too long. Please try again." : message }, { status: /migração|Supabase|Gemini|API/i.test(message) ? 503 : 502 });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.cardId !== "string" || !["again","hard","good","easy"].includes(body.result)) return NextResponse.json({ error: "Revisão inválida." }, { status: 400 });
    const { data, error } = await supabase.rpc("review_academic_card", { p_card_id: body.cardId, p_result: body.result });
    if (error) return NextResponse.json({ error: "Could not save the review. Check the Academic Supabase migration." }, { status: 503 });
    return NextResponse.json({ dueAt: data });
  } catch { return NextResponse.json({ error: "Pedido de revisão inválido." }, { status: 400 }); }
}
