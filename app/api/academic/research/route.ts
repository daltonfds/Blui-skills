import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Inicia sessão para continuar." }, { status: 401 });

  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const language = typeof body.language === "string" ? body.language.slice(0, 30) : "Português";
    const depth = ["aprofundada", "panorâmica", "comparativa"].includes(body.depth) ? body.depth : "aprofundada";
    if (topic.length < 8 || topic.length > 2000) return NextResponse.json({ error: "Indica uma pergunta de investigação com 8 a 2.000 caracteres." }, { status: 400 });

    const { data: profile, error: profileError } = await supabase.from("profiles").select("credits").eq("id", user.id).maybeSingle();
    if (profileError || !profile) return NextResponse.json({ success: false, error: "Não foi possível verificar os créditos." }, { status: 503 });
    if (profile.credits < 1) return NextResponse.json({ success: false, error: "Não tens créditos suficientes. Adiciona créditos antes de pesquisar." }, { status: 402 });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ success: false, error: "Chave da API Gemini não configurada. Define GEMINI_API_KEY nas variáveis de ambiente da Vercel." }, { status: 503 });
    // Use a known-supported Gemini model instead of an arbitrary provider/model that can return HTTP 404.\n    const model = "gemini-2.5-flash";
    const prompt = `Conduct a ${depth} research report in ${language} on this question: ${topic}

Use Google Search grounding to find relevant, credible and recent sources. Synthesize evidence, do not merely list search results. Structure the report with: research question and scope; executive summary; key findings with dates and geographic scope where relevant; competing explanations or points of disagreement; limitations and gaps; conclusion; and a short list of the most useful sources. Clearly distinguish established evidence from inference. Never invent studies, statistics, authors, quotations or publication dates. Prefer primary, official, academic and reputable sources. Make the report specific to the question. Write naturally and professionally, without generic AI filler. Return plain text with clear headings.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Academic research failed", { status: response.status, detail: detail.slice(0, 250) });
      if (response.status === 429) return NextResponse.json({ success: false, error: "O limite da API Gemini foi atingido. Tenta novamente mais tarde." }, { status: 429 });
      return NextResponse.json({ success: false, error: response.status === 404 ? "O modelo ou endpoint Gemini não foi encontrado (HTTP 404). Confirma a disponibilidade do modelo gemini-2.5-flash e a chave GEMINI_API_KEY." : response.status === 401 || response.status === 403 ? "A chave da API Gemini é inválida ou não tem permissões. Confirma GEMINI_API_KEY." : `A API Gemini falhou (HTTP ${response.status}). Tenta novamente mais tarde.` }, { status: 502 });
    }
    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.flatMap((chunk: { web?: { uri?: string; title?: string } }) =>
      chunk.web?.uri ? [{ title: String(chunk.web.title || chunk.web.uri).slice(0, 300), url: String(chunk.web.uri) }] : []
    ).filter((source: {url:string}, index: number, all: {url:string}[]) => all.findIndex(item => item.url === source.url) === index).slice(0, 15);
    if (!content || content.length < 500) return NextResponse.json({ success: false, error: "O Gemini devolveu um relatório incompleto. Reformula a pergunta e tenta novamente." }, { status: 502 });
    if (sources.length < 2) return NextResponse.json({ success: false, error: "Não foi possível confirmar fontes suficientes para esta pesquisa. Tenta uma pergunta mais específica." }, { status: 502 });

    const result = { title: topic.slice(0, 160), content, sources, researchedAt: new Date().toISOString() };
    const { data: generationId, error: saveError } = await supabase.rpc("create_academic_generation", {
      p_mode: "research", p_title: result.title, p_input_data: { topic, language, depth }, p_output_data: result, p_cards: [],
    });
    if (saveError) {
      console.error("Academic research save failed", saveError.message);
      if (/insufficient credits|no credits/i.test(saveError.message)) return NextResponse.json({ error: "Os créditos acabaram. Atualiza o saldo e tenta novamente." }, { status: 402 });
      return NextResponse.json({ error: "A pesquisa foi concluída mas não pôde ser guardada. Confirma que a migração Academic foi aplicada." }, { status: 503 });
    }
    return NextResponse.json({ success: true, id: generationId, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ success: false, error: /timeout|abort/i.test(message) ? "A pesquisa demorou demasiado tempo. Tenta novamente." : message }, { status: 502 });
  }
}
