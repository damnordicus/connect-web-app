import { createClient } from "@supabase/supabase-js";
import type { LoaderFunctionArgs } from "react-router"

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id");

    if(!id){
        throw new Error("Id required");
    }

    const {data: orgData, error: orgError} = await supabase.from("organization").select().eq("id", id).single();

    if(orgData){
        return {data: orgData}
    }
    
    const {data: baseData, error: baseError} = await supabase.from("baseDetails").select().eq("base_id", id).single();
    return {data: baseData}
}