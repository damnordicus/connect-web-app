import { Form, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import type { Route } from "../+types/root";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Button } from "~/components/ui/button";
// import { Tabs, TabsList,  TabsContent, TabsTrigger } from "~/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

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
    const {data: user} = await supabase.from("user").select("*").eq("id", cookies.user_id)
    // console.log(baseId[0].current_base)
    const baseId = user[0].current_base;
    const userId = user[0].id;
    if(user && user[0].role === "ORG"){
        // console.log(baseId, userId)
        const { data: orgs } = await supabase.from("organization").select("*").eq("base_id", baseId).is("user_id", null)
        return {orgs, userId}
    } else if(user && user[0].role === "BASE"){
        const { data: bases } = await supabase.from("base").select(`*, baseDetails!left(base_id)`).is('baseDetails.base_id', null);
        return {bases, userId}
    }
    // return {orgs, userId: cookies.user_id, bases}
}

export const action = async ({request}: ActionFunctionArgs) => {
    const formData = await request.formData();
    const userId = formData.get("userId");
    const orgId = formData.get("orgId");
    const baseId = formData.get("baseId");
    const _action = formData.get("_action");
    console.log(formData)

    if(_action === "orgSubmit"){
        const {data} = await supabase.from("request").insert({"user_id": userId, "org_id": orgId, "created_at": new Date().toISOString(), "request_type": "org-admin"})
        return redirect("/home");
    }
    if(_action === "baseSubmit"){
        const {data, error} = await supabase.from("request").insert({"user_id": userId, "base_id": baseId, "created_at": new Date().toISOString(), "request_type": "base-admin"})
        console.log(error)
        return redirect("/home");
    }
}

export default function RequestOrg({loaderData}: Route.ComponentProps){
    const {orgs, userId, bases} = loaderData;
    console.log(bases)
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [selectedBaseId, setSelectedBaseId] = useState("");

    const handleOrgSelect = (e) => {
        setSelectedOrgId(e);
    }

    const handleBaseSelect = (e) => {
        setSelectedBaseId(e);
    }
    // console.log(loaderData)
    return(
        <div className="w-full h-full p-4 bg-linear-to-br from-blue-400 to-teal-300">
            {orgs && 
                    <Card>
                        <CardHeader>
                            Select an organization: 
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Select onValueChange={(e) => handleOrgSelect(e)}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="..."/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {orgs.map((org, index: number) => 
                                        <SelectItem key={index} value={org.id}>{org.name}</SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </CardContent>
                        <CardFooter>
                            <Form method="POST">
                                <input type="hidden" name="orgId" value={selectedOrgId} />
                                <input type="hidden" name="userId" value={userId}/>
                                <Button variant="default" name="_action" value="orgSubmit" type="submit" className="bg-blue-400 disabled:bg-gray-300" disabled={selectedOrgId ? false : true}>Submit Request</Button>
                            </Form>
                        </CardFooter>
                    </Card>
                }
                {bases && 
                    <Card>
                    <CardHeader>
                        Select a base: 
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Select onValueChange={(e) => handleBaseSelect(e)}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="..."/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {bases && bases.length > 0 && bases.map((base, index: number) => 
                                    <SelectItem key={index} value={base.id}>{base.name}</SelectItem>
                                    )}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </CardContent>
                    <CardFooter>
                        <Form method="POST">
                            <input type="hidden" name="baseId" value={selectedBaseId} />
                            <input type="hidden" name="userId" value={userId}/>
                            <Button variant="default" name="_action" value="baseSubmit" type="submit" className="bg-blue-400 disabled:bg-gray-300" disabled={selectedBaseId ? false : true}>Submit Request</Button>
                        </Form>
                    </CardFooter>
                </Card>
                }
        </div>
    )
}