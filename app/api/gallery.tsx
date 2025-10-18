import { createClient } from "@supabase/supabase-js"
import type { LoaderFunctionArgs } from "react-router"

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

export const loader = async ({request}: LoaderFunctionArgs) => {
    const {data: galleryData, error: galleryError} = await supabase.storage.from("images").list('organization', {limit: 100, offset: 0, sortBy:{column: 'name', order: 'asc'}});
    console.log('api')
    if(galleryError){
        console.error(galleryError)
    }

    console.log(galleryData)

    const publicUrls = galleryData?.filter(item => item.metadata.size > 0).map(file => {
           const { data } = supabase.storage.from('images').getPublicUrl("organization/" + file.name)

            return {
                name: file.name,
                url: data.publicUrl,
                createdAt: file.created_at
            } 
    })
    return { publicUrls }
}