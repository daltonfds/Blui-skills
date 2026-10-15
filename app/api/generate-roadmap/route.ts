import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askGemini } from "@/lib/ai";
import { ROADMAP_SYSTEM } from "@/lib/prompts";
import { roadmapInput } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

type RoadmapResult = {
  projectName: string;
  prd: string;
  architecture: string;
  roadmap: Array<{
    title: string;
    goal: string;
    tasks: string[];
    acceptanceCriteria: string[];
  }>;
  masterPrompt: string;
};

function isRoadmapResult(value: unknown): value is RoadmapResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.projectName === "string" &&
    typeof result.prd === "string" &&
    typeof result.architecture === "string" &&
    typeof result.masterPrompt === "string" &&
    (result.mermaid === undefined || typeof result.mermaid === "string") &&
    Array.isArray(result.roadmap) &&
    result.roadmap.every((phase) => {
      if (!phase || typeof phase !== "object") return false;
      const item = phase as Record<string, unknown>;
      return typeof item.title === "string" &&
        typeof item.goal === "string" &&
        Array.isArray(item.tasks) && item.tasks.every((task) => typeof task === "string") &&
        Array.isArray(item.acceptanceCriteria) &&
        item.acceptanceCriteria.every((criterion) => typeof criterion === "string");
    })
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = roadmapInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 },
      );
    }

    // Guest demos are generated without creating a Supabase profile, project, or credit record.
    // The browser limits this anonymous path to one successful demo per localStorage profile.
    if (!user) {
      const generated = await askGemini<unknown>(
        ROADMAP_SYSTEM,
        JSON.stringify({ idea: parsed.data.idea, stack: parsed.data.stack, visualStyle: parsed.data.visualStyle, deviceSupport: parsed.data.deviceSupport }),
      );
      if (!isRoadmapResult(generated)) {
        return NextResponse.json({ error: "The AI returned an incomplete roadmap. Please try again." }, { status: 502 });
      }
      return NextResponse.json({ result: generated, guestDemo: true });
    }

    // Check credits before paying for an AI request; the RPC below checks again atomically.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Could not verify your credit balance. Please try again." }, { status: 503 });
    }
    if (profile.credits < 1) {
      return NextResponse.json({ error: "You have no credits left. Please add credits before generating a roadmap." }, { status: 402 });
    }

    // Generate first: temporary AI/API failures must not consume a credit.
    const generated = await askGemini<unknown>(
      ROADMAP_SYSTEM,
      JSON.stringify({ idea: parsed.data.idea, stack: parsed.data.stack, visualStyle: parsed.data.visualStyle, deviceSupport: parsed.data.deviceSupport }),
    );

    if (!isRoadmapResult(generated)) {
      return NextResponse.json(
        { error: "The AI returned an incomplete roadmap. Your credit was not used; please try again." },
        { status: 502 },
      );
    }

    // The RPC deducts one credit and saves the project in the same database transaction.
    const { data: projectId, error: saveError } = await supabase.rpc("create_roadmap_project", {
      p_title: generated.projectName.slice(0, 120) || "New project",
      p_description: parsed.data.idea,
      p_tech_stack: parsed.data.stack,
      p_prd_architecture: { prd: generated.prd, architecture: generated.architecture },
      p_roadmap_steps: generated.roadmap,
      p_master_prompt: generated.masterPrompt,
    });

    if (saveError) {
      console.error("Roadmap save failed", saveError.message);
      if (/insufficient credits|no credits/i.test(saveError.message)) {
        return NextResponse.json({ error: "You have no credits left. Please try again after adding credits." }, { status: 402 });
      }
      return NextResponse.json({ error: "The roadmap was generated but could not be saved. No credit was deducted; please try again." }, { status: 503 });
    }

    return NextResponse.json({ result: generated, projectId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = /not configured|migration|supabase/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
