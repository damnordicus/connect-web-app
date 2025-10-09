import { createClient } from "@supabase/supabase-js"
import type { LoaderFunctionArgs } from "react-router"

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({ request }: LoaderFunctionArgs) => {
      const searchParams = new URL(request.url).searchParams;
      const {id} = searchParams.get("id");

      if(!id){
            return {}
      }

      const { data } = await supabase.from("baseDetails").select().eq("id", id);
      return { data }
}

export default function RequestBaseUpdate(){
      return (
            <div>
                  
            </div>
      )
}