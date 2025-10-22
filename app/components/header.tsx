import { Outlet, redirect, useNavigate, useSearchParams, type ActionFunctionArgs } from "react-router";
import { Card, CardContent } from "./ui/card";
import { createClient } from "@supabase/supabase-js";
import type { Route } from "../+types/root";
import { Button } from "./ui/button";
import Cookies from "js-cookie";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";

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
    const {data: bases} = await supabase.from("baseDetails").select(`base(*)`).eq("user_id", cookies.user_id)
    // console.log('bases: ', bases)
    
    return { orgs: data || [], userId: cookies.user_id, isAuthenticated: true, user, bases };
}

export default function Header({loaderData}: Route.ComponentProps){
    const { orgs, userId, user, bases } = loaderData;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentOrg = searchParams.get('org');

    const handleOrgChange = (selectedEnt: string) => {
        // console.log('selectedEnt: ', selectedEnt),
        // console.log('org:', orgs)
        // console.log('bases:', bases)
        if(orgs.find(ent => ent.id === selectedEnt)){
            // console.log(orgs.includes(selectedEnt))
            navigate(`/admin/org?org=${selectedEnt}`, {replace: true});
        }
        if(bases.find(ent => ent.base.id === selectedEnt)){
            // console.log('bases.includes(selectedEnt)')
            navigate(`/admin/base?id=${selectedEnt}`, {replace: true});
        }
    }
    // console.log('pi', bases)
    return (
        <>
        <Card className="w-full flex-shrink-0 h-[50px] rounded-none justify-center bg-blue-400">
            <CardContent className="inline-flex gap-8 justify-between">
                <div className="flex items-center gap-8">
                <p className="text-xl text-white" onClick={() => navigate('home')}>Virtual Directory</p>
                {/* {user[0].role !== "SUPERADMIN" && 
                <>
                <Select name="current-org" value={currentOrg || ""} onValueChange={(e) => handleOrgChange(e)}>
                    <SelectTrigger className="w-[200px] bg-white/30">
                        <SelectValue placeholder="Select an option"/>
                    </SelectTrigger>
                    <SelectContent>
                        {orgs.length > 0 && <SelectGroup>
                            <SelectLabel>Organizations</SelectLabel>
                            {orgs.map((org, index) => <SelectItem key={index} value={org.id}>{org.name}</SelectItem>)}
                        </SelectGroup>}
                        {bases.length > 0 && 
                        <SelectGroup>
                            <SelectLabel>Bases</SelectLabel>
                             {bases.map((base, index) => <SelectItem key={index} value={base.base.id}>{base.base.name}</SelectItem>)}
                        </SelectGroup>}
                    </SelectContent>
                </Select>
                <Button className="bg-white/30 border hover:bg-white hover:text-black" onClick={() => navigate("requestOrg")}>Request Org Admin</Button></>} */}
                </div>
                <Button variant={'destructive'} onClick={() => {Cookies.remove('user_id'); navigate('/')}}>Logout</Button>
            </CardContent>
        </Card>
        <Outlet/>
        </>
    );
}