type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string; status?: string };
};

const FALLBACK_MODEL = "gemini-2.5-flash";

async function requestGemini(model: string, key: string, system: string, input: string) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: input }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    },
  );
}

export async function askGemini<T>(system: string, input: string): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const model = configuredModel || FALLBACK_MODEL;

  if (!key) {
    throw new Error("A API de IA ainda não está configurada. Adiciona GEMINI_API_KEY nas variáveis de ambiente da aplicação.");
  }

  let response: Response;
  try {
    response = await requestGemini(model, key, system, input);
    // Some deployments have an obsolete GEMINI_MODEL configured. Retry once with
    // the supported stable Flash model only when the configured model is missing.
    if ((response.status === 404 || response.status === 400) && model !== FALLBACK_MODEL) {
      const details = await response.clone().text().catch(() => "");
      if (/model|not found|not supported|unknown/i.test(details)) {
        console.warn("Configured Gemini model unavailable; retrying with stable fallback.", {
          configuredModel: model,
          fallbackModel: FALLBACK_MODEL,
          status: response.status,
        });
        response = await requestGemini(FALLBACK_MODEL, key, system, input);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("A análise de IA demorou demasiado. Tenta novamente.");
    }
    throw new Error("Não foi possível contactar a API de IA. Verifica a ligação e tenta novamente.");
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    // Log only the model and response body; never log request headers or the API key.
    console.error("Gemini API request failed", {
      status: response.status,
      model,
      details: details.slice(0, 600),
    });

    if (response.status === 429) {
      throw new Error("Limite da API de IA atingido. Aguarda um pouco e tenta novamente.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("A chave Gemini é inválida, não está ativa ou não tem acesso à API. Confirma GEMINI_API_KEY no Vercel.");
    }
    if (response.status === 404) {
      throw new Error("O modelo Gemini configurado não foi encontrado. Define GEMINI_MODEL como gemini-2.5-flash no Vercel.");
    }
    if (response.status >= 500) {
      throw new Error("O serviço Gemini está temporariamente indisponível. Tenta novamente dentro de instantes.");
    }
    throw new Error(`A API Gemini recusou o pedido (HTTP ${response.status}). Confirma a configuração da API e tenta novamente.`);
  }

  const data = (await response.json()) as GeminiResponse;
  const raw = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");

  if (!raw) {
    const reason = data.error?.message || "empty response";
    console.error("Gemini returned no content", { model, reason: reason.slice(0, 300) });
    throw new Error("A IA não devolveu um resultado válido. Tenta novamente.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("A IA devolveu um formato inesperado. Tenta novamente.");
  }
}
