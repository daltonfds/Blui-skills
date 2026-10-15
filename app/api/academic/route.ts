import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const SYSTEM = `Atuas como um Arquiteto de Software Principal e Pesquisador Académico Sénior.

REGRAS DE EXECUÇÃO OBRIGATÓRIAS:
1. IDIOMA: deteta o idioma pedido pelo utilizador. Se o input estiver em Português, responde integralmente em Português nativo, formal e consistente. Não mudes para Inglês. Respeita outro idioma apenas quando explicitamente selecionado.
2. PROFUNDIDADE: produz documentos substanciais, analíticos, detalhados e utilizáveis. Evita generalidades, repetições, listas vagas e frases de preenchimento.
3. FORMATAÇÃO: usa Markdown limpo, títulos hierárquicos, tabelas quando úteis e exemplos estritamente tipados quando pertinentes.
4. INTEGRIDADE ACADÉMICA: usa apenas o material fornecido e fontes efetivamente verificadas na solicitação. Nunca inventes autores, citações, páginas, datas, DOI, estatísticas ou referências. Marca os dados bibliográficos ausentes como [DADOS BIBLIOGRÁFICOS A VERIFICAR]. Não afirmes ter realizado pesquisa externa quando esta rota não a executou.
5. METADADOS: incorpora estudante, instituição, curso, disciplina, docente, local, data e norma solicitada quando fornecidos; assinala os campos ausentes sem inventar valores.
6. NORMA: segue ABNT ou APA 7 conforme indicado e informa que a formatação institucional final deve ser confirmada.
7. SAÍDA: devolve apenas JSON válido, sem blocos Markdown externos.

Para mode paper, devolve {"title":"...","content":"documento Markdown académico completo","referencesNote":"..."} com capa, folha de rosto, índice sem números de página inventados, introdução com contextualização, problema, hipóteses quando aplicáveis, objetivo geral e objetivos específicos, metodologia, fundamentação teórica desenvolvida em capítulos e subcapítulos analíticos, discussão sustentada pelas fontes fornecidas, conclusão sem dados novos e referências normalizadas. Desenvolve os argumentos em profundidade e diferencia evidência, interpretação e limitações.

Para mode study, devolve {"title":"...","summary":"...","cards":[{"topic":"...","question":"...","answer":"...","options":["A...","B...","C...","D..."],"type":"multiple_choice|open_question|flashcard"}]}. Cria 8–16 cartões ancorados nas fontes, com variedade de perguntas de escolha múltipla, questões abertas e cartões de memória. Cada questão de escolha múltipla deve ter exatamente uma opção correta e uma explicação fundamentada na resposta. Não acrescentes factos sem suporte.`;

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
      instructions: mode === "paper" ? "Create a complete academic paper in Markdown using only verifiable citations from the supplied source." : "Create a summary, multiple-choice questions, open-ended questions and spaced-repetition flashcards." };
    const generated = await generate(input, pdf);
    if (!validOutput(generated, mode)) return NextResponse.json({ error: "The result was incomplete. No credit was used; please try again." }, { status: 502 });
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
    if (typeof body.cardId !== "string" || !["again","hard","good","easy"].includes(body.result)) return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
    const { data, error } = await supabase.rpc("review_academic_card", { p_card_id: body.cardId, p_result: body.result });
    if (error) return NextResponse.json({ error: "Could not save the review. Check the Academic Supabase migration." }, { status: 503 });
    return NextResponse.json({ dueAt: data });
  } catch { return NextResponse.json({ error: "Invalid review request." }, { status: 400 }); }
}
