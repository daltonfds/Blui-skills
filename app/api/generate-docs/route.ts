import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askGemini } from "@/lib/ai";
import { DOCS_SYSTEM } from "@/lib/prompts";
import { docsInput } from "@/lib/validation";

export const runtime = "nodejs";

type DocsResult = {
  readme: string;
  dataDictionary: string;
  apiReference: string;
  contextPrompt: string;
};

function isDocsResult(value: unknown): value is DocsResult {
  if (!value || typeof value !== "object") return false;
  const docs = value as Record<string, unknown>;
  return ["readme", "dataDictionary", "apiReference", "contextPrompt"]
    .every((key) => typeof docs[key] === "string" && (docs[key] as string).trim().length >= 40);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

    const { data, error } = await supabase
      .from("docs_generations")
      .select("id,project_name,documents,source_files,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Docs history query failed", error.message);
      return NextResponse.json({ error: "Could not load saved documentation. Apply the Blui Docs database migration and try again." }, { status: 503 });
    }
    return NextResponse.json({ documents: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Could not load saved documentation." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = docsInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }

    const rawFiles: unknown[] = body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).sourceFiles)
      ? (body as Record<string, unknown>).sourceFiles as unknown[]
      : [];
    const sourceFiles = rawFiles
      .filter((file): file is string => typeof file === "string")
      .map((file) => file.replace(/[^\w.\- ()]/g, "").slice(0, 120))
      .filter(Boolean)
      .slice(0, 20);

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("credits").eq("id", user.id).maybeSingle();
    if (profileError || !profile) {
      return NextResponse.json({ error: "Could not verify your credit balance. Please try again." }, { status: 503 });
    }
    if (profile.credits < 1) {
      return NextResponse.json({ error: "You have no credits left. Add credits before generating documentation." }, { status: 402 });
    }

    const generated = await askGemini<unknown>(
      DOCS_SYSTEM,
      JSON.stringify({
        projectName: parsed.data.projectName || "Existing project",
        suppliedSource: parsed.data.source,
        suppliedFileNames: sourceFiles,
        task: "Produce the four required documentation files from the evidence provided. Redact any detected secret values.",
      }),
    );

    if (!isDocsResult(generated)) {
      return NextResponse.json({
        error: "The AI returned incomplete documentation. Your credit was not used; please try again with more project files.",
      }, { status: 502 });
    }

    const { data: documentId, error: saveError } = await supabase.rpc("create_docs_generation", {
      p_project_name: parsed.data.projectName || "Untitled project",
      p_documents: generated,
      p_source_files: sourceFiles,
    });

    if (saveError) {
      console.error("Docs generation save failed", saveError.message);
      if (/insufficient credits|no credits/i.test(saveError.message)) {
        return NextResponse.json({ error: "You have no credits left. Please add credits before generating documentation." }, { status: 402 });
      }
      return NextResponse.json({
        error: "Documentation was generated but could not be saved. No credit was deducted; apply the Blui Docs migration and try again.",
      }, { status: 503 });
    }

    return NextResponse.json({ result: generated, documentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    if (/API de IA|Gemini|Limite da API|formato inesperado|não devolveu/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 502 });
    }
    console.error("Docs generation failed", message);
    return NextResponse.json({ error: "Could not generate documentation. Check the AI configuration and try again." }, { status: 500 });
  }
}
