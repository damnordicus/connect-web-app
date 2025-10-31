import { createClient } from "@supabase/supabase-js"
import type { LoaderFunctionArgs } from "react-router"

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const searchParams = new URL(request.url).searchParams;
    const baseId = searchParams.get('baseId');
    const { data: orgFolders } = await supabase.storage.from('images').list(`bases/${baseId}/organizations`);
    // const logoPromises = orgFolders?.map(folder => supabase.storage.from('images').list(`bases/${baseId}/organizations/${folder.name}`));

    const logosWithOrg = await Promise.all(
        orgFolders.map(async (folder) => {
            const { data } = await supabase.storage
                .from('images')
                .list(`bases/${baseId}/organizations/${folder.name}`)

            return data?.map(file => ({ ...file, orgFolder: folder.name })) || []
        })
    )

    const publicUrls = logosWithOrg
        .flat()
        .filter(file => file.metadata.size > 0)
        .map(file => {
            const { data } = supabase.storage
                .from('images')
                .getPublicUrl(`bases/${baseId}/organizations/${file.orgFolder}/${file.name}`)

            return {
                name: file.name,
                url: data.publicUrl,
                createdAt: file.created_at,
                orgId: file.orgFolder // Optional: include org ID
            }
        })
    return { publicUrls }
}