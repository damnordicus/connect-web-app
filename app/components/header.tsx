import { Outlet, useNavigate, useSearchParams } from "react-router";
import { Card, CardContent } from "./ui/card";
import { createClient } from "@supabase/supabase-js";
import type { Route } from "../+types/root";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async () => {
    const {data} = await supabase.from('organization').select().eq('user_id', '304825a8-a401-4fcd-a4e0-a278e136b4e0');
    
    return {orgs: data }
}

export default function Header({loaderData}: Route.ComponentProps){
    const { orgs } = loaderData;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentOrg = searchParams.get('org');

    const handleOrgChange = (selectedOrg: string) => {
        console.log('test')
        navigate(`/?org=${selectedOrg}`, {replace: true});
    }

    return (
        <>
        <Card className="w-full h-[50px] rounded-none justify-center bg-blue-400">
            <CardContent className="inline-flex gap-8">
                <p className="text-xl text-white">Virtual Directory</p>
                <select name="current-org" className="text-white border border-white/40 rounded-md px-1 bg-blue-300" value={currentOrg || ""} onChange={(e) => handleOrgChange(e.currentTarget.value)}>
                    <option value="">Select an Org</option>
                    {orgs.map((org, index) => <option key={index} value={org.id}>{org.name}</option>)}
                </select>
            </CardContent>
        </Card>
        <Outlet/>
        </>
    );
}