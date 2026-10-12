type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export async function askGemini<T>(system: string, input: string): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  if (!key) {
    throw new Error("A API de IA ainda não está configurada.");
  }

  const response = await fetch(
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

  if (!response.ok) {
    // Do not log request headers or the API key.
    console.error("Gemini API returned HTTP", response.status);
    if (response.status === 429) {
      throw new Error("Limite da API de IA atingido. Tenta mais tarde.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("A chave da API Gemini é inválida ou não tem acesso ao modelo.");
    }
    throw new Error("Não foi possível concluir a análise de IA.");
  }

  const data = (await response.json()) as GeminiResponse;
  const raw = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");

  if (!raw) {
    throw new Error("A IA não devolveu um resultado válido.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("A IA devolveu um formato inesperado. Tenta novamente.");
  }
}
