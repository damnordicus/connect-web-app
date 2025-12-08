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
        orgData.links = JSON.stringify(orgData.links)
        return {data: orgData}
    }

    //general base details
    const {data: baseData, error: baseError} = await supabase.from("baseDetails").select().eq("base_id", id).single();
    //additional fields for base
    const {data: baseAppData, error: baseDataError} = await supabase.from("appFields").select().eq("base_id", id).single();
    // console.log({...baseData,...baseAppData})
    return {data: {...baseData, ...baseAppData}}
}