type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string; status?: string };
};

// Latest stable Flash model for complex Architect planning and code generation.
const FALLBACK_MODEL = "gemini-3.8-flash";
const FAST_FALLBACK_MODEL = "gemini-3.5-flash-lite";

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
          maxOutputTokens: 4096,
          // Gemini 3 models use thinkingLevel rather than the Gemini 2.5 thinkingBudget.
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
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
    // If an obsolete or unavailable model is configured, retry with the current stable Flash model.
    if ((response.status === 404 || response.status === 400) && model !== FALLBACK_MODEL) {
      const details = await response.clone().text().catch(() => "");
      if (/model|not found|not supported|unknown|thinkingbudget/i.test(details)) {
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

  // A quota response is not transient within this request: return immediately to avoid
  // multiplying requests against an exhausted RPM/RPD quota.
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    const waitSeconds = retryAfter && /^\d+$/.test(retryAfter) ? Math.max(1, Number(retryAfter)) : 30;
    throw new Error(`O limite de requisições da API Gemini foi atingido. Aguarda ${waitSeconds} segundos e tenta novamente.`);
  }

  // Retry other transient provider failures at most once, then use the faster Flash-Lite model.
  if ([500, 502, 503, 504].includes(response.status)) {
    const initialStatus = response.status;
    await new Promise((resolve) => setTimeout(resolve, 900));
    try {
      const retry = await requestGemini(model, key, system, input);
      if (retry.ok || ![429, 500, 502, 503, 504].includes(retry.status)) {
        response = retry;
      } else {
        response = await requestGemini(FAST_FALLBACK_MODEL, key, system, input);
      }
    } catch {
      try {
        response = await requestGemini(FAST_FALLBACK_MODEL, key, system, input);
      } catch {
        // Preserve the initial response to return a useful service error below.
      }
    }
    if (!response.ok) {
      console.error("Gemini API failed after retry/fallback", {
        initialStatus,
        finalStatus: response.status,
        model,
        fallbackModel: FAST_FALLBACK_MODEL,
      });
    }
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
      throw new Error("O modelo Gemini configurado não foi encontrado. Define GEMINI_MODEL como gemini-3.8-flash no Vercel.");
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
