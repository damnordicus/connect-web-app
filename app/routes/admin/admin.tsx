import { Outlet, redirect, type LoaderFunctionArgs } from "react-router";
import type { Route } from "../../+types/root";
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
        const {data} = await supabase.from("request").select(`*, user(email), organization!org_id(name), base!base_id(name)`).eq("data", null)
        const {data: updateData} = await supabase.from("request").select(`*, user(email), organization!org_id(name), base!base_id(name)`).neq("data", null)
        console.log('test: ', data)
        return {data, updateData}
       
    }catch(error){
        console.error('Error: ', error)
    }
}

export default function Dashboard ({loaderData}: Route.ComponentProps) {
    const {data: requests, updateData} = loaderData;
    // console.log(requests)
    const [requestList, setRequestList] = useState(requests)
    const [updateDataList, setUpdateDataList] = useState(updateData)
    const approve = async (userId: string, entId: {id: string, ent: string}, requestId: string) => {
        try {
            let updateData = null;
            let updateError = null;
            
            if(entId.ent === "org"){
                const {data: orgData, error: orgError} = await supabase
                    .from("organization")
                    .update({"user_id": userId})
                    .eq("id", entId.id)

                updateData = orgData;
                updateError = orgError;
            } 
            else if(entId.ent === "base"){
                const {data: baseData, error: baseError} = await supabase
                    .from("baseDetails")
                    .update({"user_id": userId})
                    .eq("id", entId.id)

                updateData = baseData;
                updateError = baseError;
            }
            else {
                // Handle unexpected entity type
                console.error('Unknown entity type:', entId.ent);
                return;
            }

            // Check if update was successful before proceeding
            if (updateError) {
                console.error('Error updating entity:', updateError);
                return { data: null, error: updateError };
            }

            // Only delete the request if the update was successful
            const {data: result, error: deleteError} = await supabase
                .from("request")
                .delete()
                .eq("id", requestId)

            if (deleteError) {
                console.error('Error deleting request:', deleteError);
                return { data: updateData, error: deleteError };
            }

            // Update successful and request deleted - update local state
            setRequestList(prev => prev.filter(request => request.id !== requestId));
            
            console.log('Update data:', updateData);
            console.log('Delete result:', result);
            
            
            return redirect("/");
            
        } catch (error) {
            console.error('Error approving request:', error);
            return { data: null, error };
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
        <div className="w-full h-screen p-6 space-y-6 bg-linear-to-br from-blue-400 to-teal-300">
            <Card className="">
                <CardHeader>
                    Account Requests
                </CardHeader>
                <CardContent>
                    {requestList.length > 0 ? 
                    <table className="w-full  bg-gray-200 rounded-t-lg">
                        <thead className="text-left">
                            <tr>
                                <th className="pl-2">
                                    Email
                                </th>
                                <th>
                                    Organization/Base
                                </th>
                                <th>
                                    Data
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
                                    <td>{request.organization?.name ?? request.base?.name}</td>
                                    <td><Button className="m-2" variant={"outline"}>View Data</Button></td>
                                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="space-x-2">
                                            <Button className="bg-green-500" onClick={() => approve(request.user_id, {id: request.org_id ?? request.base_id, ent: request.org_id ? "org" : "base"}, request.id)}>Approve</Button>
                                            <Button variant={"destructive"} onClick={() => deny(request.id)}>Deny</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!requests && <tr></tr>}
                        </tbody>
                    </table> : <p className="italic text-gray-400 text-center">No Account Requests!</p>}
                </CardContent>
            </Card>
            <Card className="">
                <CardHeader>
                    Update Requests
                </CardHeader>
                <CardContent>
                    <table className="w-full  bg-gray-200 rounded-t-lg">
                        <thead className="text-left">
                            <tr>
                                <th className="pl-2">
                                    Email
                                </th>
                                <th>
                                    Organization/Base
                                </th>
                                <th>
                                    Data
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
                            {updateDataList && updateDataList.map((request, index) => (
                                <tr key={index} className="bg-white border">
                                    <td className="pl-2">{request.user.email}</td>
                                    <td>{request.organization?.name ?? request.base?.name}</td>
                                    <td><Button className="m-2" variant={"outline"}>View Data</Button></td>
                                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="space-x-2">
                                            <Button className="bg-green-500" onClick={() => approve(request.user_id, {id: request.org_id ?? request.base_id, ent: request.org_id ? "org" : "base"}, request.id)}>Approve</Button>
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