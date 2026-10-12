import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
export async function createClient() {
 const store=await cookies(); const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) throw new Error("Supabase não está configurado.");
 return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll:(items)=>{try{items.forEach(({name,value,options})=>store.set(name,value,options));}catch{/* Server Components não podem escrever cookies. */}}}});
}
