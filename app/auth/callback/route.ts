import {NextResponse} from "next/server";import {createClient} from "@/lib/supabase/server";
const SITE_URL=process.env.NEXT_PUBLIC_SITE_URL||"https://blui.online";
export async function GET(request:Request){const url=new URL(request.url);const code=url.searchParams.get("code");if(code){const sb=await createClient();const {error}=await sb.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL("/dashboard",SITE_URL));}return NextResponse.redirect(new URL("/login?error=confirmation_failed",SITE_URL));}
