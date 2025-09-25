import { Outlet, redirect, useNavigate, useSearchParams, type ActionFunctionArgs } from "react-router";
import { Card, CardContent } from "./ui/card";
import { createClient } from "@supabase/supabase-js";
import type { Route } from "../+types/root";
import { Button } from "./ui/button";
import Cookies from "js-cookie";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

// components/header.tsx
export const loader = async ({request}: ActionFunctionArgs) => {
    const cookieHeader = request.headers.get('Cookie');
    
    if (!cookieHeader) {
        return { orgs: [], userId: null, isAuthenticated: false };
    }
    
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            acc[name] = decodeURIComponent(value);
        }
        return acc;
    }, {} as Record<string, string>);
        
    if (!cookies.user_id) {
        return { orgs: [], userId: null, isAuthenticated: false };
    }
    
    const {data} = await supabase.from('organization').select().eq('user_id', cookies.user_id);
    const {data: user} = await supabase.from("user").select().eq("id", cookies.user_id)
    
    return { orgs: data || [], userId: cookies.user_id, isAuthenticated: true, user };
}

export default function Header({loaderData}: Route.ComponentProps){
    const { orgs, userId, user } = loaderData;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentOrg = searchParams.get('org');

    const handleOrgChange = (selectedOrg: string) => {
        console.log('test')
        navigate(`/home?org=${selectedOrg}`, {replace: true});
    }

    return (
        <>
        <Card className="w-full h-[50px] rounded-none justify-center bg-blue-400">
            <CardContent className="inline-flex gap-8 justify-between">
                <div className="flex items-center gap-8">
                <p className="text-xl text-white">Virtual Directory</p>
                {user[0].role !== "SUPERADMIN" && <><select name="current-org" className="text-white border border-white/40 rounded-md px-1 bg-blue-300" value={currentOrg || ""} onChange={(e) => handleOrgChange(e.currentTarget.value)}>
                    <option value="">Select an Org</option>
                    {orgs.map((org, index) => <option key={index} value={org.id}>{org.name}</option>)}
                </select>
                <Button onClick={() => navigate("/requestOrg")}>Request Org Admin</Button></>}
                </div>
                <Button variant={'default'} onClick={() => {Cookies.remove('user_id'); navigate('/')}}>Logout</Button>
            </CardContent>
        </Card>
        <Outlet/>
        </>
    );
}