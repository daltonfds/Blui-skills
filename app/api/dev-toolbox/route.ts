import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

    // Both queries are scoped to the authenticated owner. RLS remains an additional boundary.
    const [projectsResult, docsResult] = await Promise.all([
      supabase.from("projects").select("id,title,description,tech_stack,roadmap,roadmap_steps,master_prompt,prd_architecture,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("docs_generations").select("id,project_name,documents,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (projectsResult.error) {
      console.error("Dev Toolbox project query failed", projectsResult.error.message);
      return NextResponse.json({ error: "Could not load saved Architect projects." }, { status: 503 });
    }
    if (docsResult.error) {
      // Keep the Toolbox usable if the Docs Generator migration has not been applied.
      console.error("Dev Toolbox docs query failed", docsResult.error.message);
      return NextResponse.json({ projects: projectsResult.data ?? [], docs: [], warning: "Docs history is unavailable. Check the Docs Generator migration." });
    }
    return NextResponse.json({ projects: projectsResult.data ?? [], docs: docsResult.data ?? [] });
  } catch {
    return NextResponse.json({ error: "Could not load Dev Toolbox data." }, { status: 500 });
  }
}
