import { redirect, type LoaderFunctionArgs } from "react-router";
import type { Route } from "../+types/root";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({request}: LoaderFunctionArgs) => {
    const cookieHeader = request.headers.get('Cookie');
    if(!cookieHeader){
        return redirect('/login');
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
    console.log(requests)
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
                            {requests && requests.map(request => (
                                <tr className="bg-white border">
                                    <td className="pl-2">{request.user.email}</td>
                                    <td>{request.organization.name}</td>
                                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                    <td></td>
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