import { Form, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import type { Route } from "../+types/root";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Button } from "~/components/ui/button";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
    const {data: baseId} = await supabase.from("user").select("current_base").eq("id", cookies.user_id)
    // console.log(baseId[0].current_base)
    const { data: orgs } = await supabase.from("organization").select().eq("base_id", baseId[0].current_base).is("user_id", null)
    console.log(orgs)
    return {orgs, userId: cookies.user_id}
}

export const action = async ({request}: ActionFunctionArgs) => {
    const formData = await request.formData();
    const userId = formData.get("userId");
    const orgId = formData.get("orgId");

    if(userId && orgId){
        const {data} = await supabase.from("request").insert({"user_id": userId, "org_id": orgId, "created_at": new Date().toISOString()})
        return redirect("/home");
    }
}

export default function RequestOrg({loaderData}: Route.ComponentProps){
    const {orgs, userId} = loaderData;

    const [selectedOrgId, setSelectedOrgId] = useState("")

    const handleOrgSelect = (e) => {
        setSelectedOrgId(e);
    }

    return(
        <div className="w-full h-screen p-4 bg-linear-to-br from-blue-400 to-teal-300">
            <Card>
                <CardHeader>
                    Select an Organization
                </CardHeader>
                <CardContent>
                    <select className="bg-gray-100 p-1 w-full rounded-md border border-black/10" onChange={(e) => handleOrgSelect(e.currentTarget.value)}>
                        {orgs.map((org, index: number) => 
                                <option key={index} value={org.id}>{org.name}</option>
                        )}
                    </select>
                </CardContent>
                <CardFooter>
                    <Form method="POST">
                        <input type="hidden" name="orgId" value={selectedOrgId} />
                        <input type="hidden" name="userId" value={userId}/>
                        <Button variant="default" className="bg-blue-400 disabled:bg-gray-300" disabled={selectedOrgId ? false : true}>Submit Request</Button>
                    </Form>
                </CardFooter>
            </Card>
        </div>
    )
}