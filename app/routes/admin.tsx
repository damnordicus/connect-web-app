import { redirect, type LoaderFunctionArgs } from "react-router";
import type { Route } from "../+types/root";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({request}: LoaderFunctionArgs) => {
    const cookieHeader = request.headers.get('Cookie');
    if(!cookieHeader){
        return redirect('/');
    }
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            acc[name] = decodeURIComponent(value);
        }
        return acc;
    }, {} as Record<string, string>);
    try {
        const {data} = await supabase.from("request").select(`*, user(email), organization(name)`)
        console.log('test: ', data)
        return {data}
       
    }catch(error){
        console.error('Error: ', error)
    }
}

export default function Dashboard ({loaderData}: Route.ComponentProps) {
    const {data: requests} = loaderData;
    // console.log(requests)
    const [requestList, setRequestList] = useState(requests)
    const approve = async (userId, orgId, requestId) => {
    try {
        const {data, error: orgError} = await supabase
            .from("organization")
            .update({"user_id": userId})
            .eq("id", orgId)
        
        const {data: result, error: deleteError} = await supabase
            .from("request")
            .delete()
            .eq("id", requestId)

        if (!orgError && !deleteError) {
            // Remove the approved request from local state
            setRequestList(prev => prev.filter(request => request.id !== requestId))
        }
        
        console.log(data, result)
    } catch (error) {
        console.error('Error approving request:', error)
    }
}

const deny = async (requestId) => {
    try {
        const {data, error} = await supabase
            .from("request")
            .delete()
            .eq("id", requestId)
        
        if (!error) {
            // Remove the denied request from local state
            setRequestList(prev => prev.filter(request => request.id !== requestId))
        }
    } catch (error) {
        console.error('Error denying request:', error)
    }
}

    useEffect(() => {
        setRequestList(requests);
    },[requests])

    return (
        <div className="w-full h-screen p-6 bg-linear-to-br from-blue-400 to-teal-300">
            <Card className="">
                <CardHeader>
                    Admin Requests
                </CardHeader>
                <CardContent>
                    <table className="w-full  bg-gray-200 rounded-t-lg">
                        <thead className="text-left">
                            <tr>
                                <th className="pl-2">
                                    Email
                                </th>
                                <th>
                                    Organization
                                </th>
                                <th>
                                    Date
                                </th>
                                <th>
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-left">
                            {requestList && requestList.map((request, index) => (
                                <tr key={index} className="bg-white border">
                                    <td className="pl-2">{request.user.email}</td>
                                    <td>{request.organization.name}</td>
                                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="space-x-2">
                                            <Button className="bg-green-500" onClick={() => approve(request.user_id, request.org_id, request.id)}>Approve</Button>
                                            <Button variant={"destructive"} onClick={() => deny(request.id)}>Deny</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!requests && <tr></tr>}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}