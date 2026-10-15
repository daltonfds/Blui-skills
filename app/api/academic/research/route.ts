import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Sign in to continue." }, { status: 401 });

  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const languageRaw = typeof body.language === "string" ? body.language.slice(0, 30) : "Auto-detect";
    const language = ["Auto-detect", "English", "Português", "Español", "Français"].includes(languageRaw) ? languageRaw : "Auto-detect";
    const depth = ["comprehensive", "overview", "comparative"].includes(body.depth) ? body.depth : "comprehensive";
    if (topic.length < 8 || topic.length > 2000) return NextResponse.json({ success: false, error: "Enter a research question between 8 and 2,000 characters." }, { status: 400 });

    const { data: profile, error: profileError } = await supabase.from("profiles").select("credits,plan_type,pass_expires_at").eq("id", user.id).maybeSingle();
    if (profileError || !profile) return NextResponse.json({ success: false, error: "Could not verify your credits." }, { status: 503 });
    const hasActivePass = ["daily_pass", "weekly_pass", "monthly_pass"].includes(profile.plan_type) && !!profile.pass_expires_at && new Date(profile.pass_expires_at).getTime() > Date.now();
    if (profile.credits < 1 && !hasActivePass) return NextResponse.json({ success: false, error: "You do not have enough credits. Add credits or activate a pass before researching." }, { status: 402 });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ success: false, error: "Gemini API key is not configured. Add GEMINI_API_KEY to the Vercel environment." }, { status: 503 });
    // Use a known-supported Gemini model instead of an arbitrary provider/model that can return HTTP 404.
    const model = "gemini-3.8-flash";
    const outputLanguageInstruction = language === "Auto-detect" ? "Detect the language of the research question and write the full report entirely in that language, without switching languages." : `Write the full report entirely in ${language}.`;
    const depthLabel = depth === "overview" ? "overview" : depth === "comparative" ? "comparative" : "comprehensive";
    const prompt = `Conduct a ${depthLabel} research report. ${outputLanguageInstruction} Research question: ${topic}

Use Google Search grounding to find relevant, credible and recent sources. Synthesize evidence, do not merely list search results. Structure the report with: research question and scope; executive summary; key findings with dates and geographic scope where relevant; competing explanations or points of disagreement; limitations and gaps; conclusion; and a short list of the most useful sources. Clearly distinguish established evidence from inference. Never invent studies, statistics, authors, quotations or publication dates. Prefer primary, official, academic and reputable sources. Make the report specific to the question. Write naturally and professionally, without generic AI filler. Return plain text with clear headings.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const systemInstruction = `Atuas como um Arquiteto de Software Principal e Pesquisador Académico Sénior. Deteta o idioma do pedido; se estiver em Português, escreve todo o relatório em Português formal e natural, sem mudar para Inglês. Produz análise profunda, específica e estruturada, não um resumo genérico. Usa Markdown limpo com títulos claros. Distingue factos verificados, inferências, desacordos e limitações. Nunca inventes referências, citações, autores, datas, estatísticas ou URLs. Usa pesquisa Google apenas para fontes efetivamente devolvidas pela ferramenta e cita as fontes relevantes. Cumpre a profundidade solicitada e responde no idioma explicitamente escolhido pelo utilizador.`;
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    });
    const response = await fetchWithRetry(url, () => ({
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(16_000),
    }));
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Academic research failed", { status: response.status, detail: detail.slice(0, 250) });
      if (response.status === 429) return NextResponse.json({ success: false, error: "The Gemini API rate limit was reached. Please try again later." }, { status: 429 });
      return NextResponse.json({ success: false, error: response.status === 404 ? "Gemini model or endpoint not found (HTTP 404). Check model availability and API access." : response.status === 401 || response.status === 403 ? "The Gemini API key is invalid or lacks permission. Check GEMINI_API_KEY." : `Gemini API request failed (HTTP ${response.status}) after retries. Please try again later.` }, { status: 502 });
    }
    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.flatMap((chunk: { web?: { uri?: string; title?: string } }) =>
      chunk.web?.uri ? [{ title: String(chunk.web.title || chunk.web.uri).slice(0, 300), url: String(chunk.web.uri) }] : []
    ).filter((source: {url:string}, index: number, all: {url:string}[]) => all.findIndex(item => item.url === source.url) === index).slice(0, 15);
    if (!content || content.length < 500) return NextResponse.json({ success: false, error: "Gemini returned an incomplete report. Refine the question and try again." }, { status: 502 });
    if (sources.length < 2) return NextResponse.json({ success: false, error: "Not enough verifiable sources were found. Try a more specific question." }, { status: 502 });

    const result = { title: topic.slice(0, 160), content, sources, researchedAt: new Date().toISOString() };
    const { data: generationId, error: saveError } = await supabase.rpc("create_academic_generation", {
      p_mode: "research", p_title: result.title, p_input_data: { topic, language, depth }, p_output_data: result, p_cards: [],
    });
    if (saveError) {
      console.error("Academic research save failed", saveError.message);
      if (/insufficient credits|no credits/i.test(saveError.message)) return NextResponse.json({ success: false, error: "Your credits have run out. Refresh your balance and try again." }, { status: 402 });
      return NextResponse.json({ success: false, error: "Research completed but could not be saved. Check that the Academic Supabase migration is applied; no credit was deducted." }, { status: 503 });
    }
    return NextResponse.json({ success: true, id: generationId, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ success: false, error: /timeout|abort/i.test(message) ? "Research took too long. Please try again." : message }, { status: 502 });
  }
}
