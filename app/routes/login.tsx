
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Form, redirect, useActionData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import type { Route } from "../+types/root";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "~/components/ui/tabs";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const loader = async ({}: LoaderFunctionArgs) => {
    const {data: bases} = await supabase.from("base").select();
    const {data: orgs} = await supabase.from("organization").select();
    return {bases, orgs}
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const _action = formData.get("_action");
    const email = formData.get("email");
    const password = formData.get("password");
    const base = formData.get("base");
    const org = formData.get("org");
    const type = formData.get("type");

    if(_action === "login"){
       try{
            const {data, error} = await supabase.from("user").select().eq("email", email).eq("password", password);
            
            if (error) {
                return { success: false, error: error.message };
            }
            
            if (data && data.length > 0) {
                const user = data[0];
                console.log(user.id)
                if(user.role === "SUPERADMIN"){
                    const response = redirect("/admin");
                    response.headers.set('Set-Cookie', `user_id=${user.id}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict; Secure`);
                    return response;
                }else{
                    const response = redirect("/home");
                    response.headers.set('Set-Cookie', `user_id=${user.id}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict; Secure`);
                    return response;
                }
                
            } else {
                return { success: false, error: "Invalid email or password" };
            }
        }catch(error){
            console.error(error)
        }
    }

    if(_action === "register"){
        const newOrg = formData.get("newOrg") as string;
        try{
            const {data, error} = await supabase.from("user").select().eq("email", email)
            console.log("data: ", data, " error: ", error)
            if(data && data.length){
                return {success: false, message:"email address already exists"}
            }
            else{
                const {data: userData, error: userError} = await supabase.from("user").insert({"email": email, "password": password, "current_base": base, "role": type?.toString().toUpperCase()}).select("id");
                if(type === "org" && org !== "..."){
                    const {data: requestResponse, error: insertError} = await supabase.from("request").insert({"created_at": new Date(Date.now()), "user_id": userData[0].id, "org_id": org})
                    // return {requestResponse, insertError}
                }
                if(type === "base"){
                    if(org === "" && newOrg.length > 0){
                        const {data: newOrgData, error: newOrgError} = await supabase.from('request').insert({"created_at": new Date(Date.now()), "user_id": userData[0].id, "data": Object.fromEntries(formData.entries()), "base_id": base })
                    }else{
                        const {data: requestResponse, error: insertError} = await supabase.from("request").insert({"created_at": new Date(Date.now()), "user_id": userData[0].id, "base_id": base})
                    }
                    // console.log(insertError)
                    // return {requestResponse, insertError}
                }
                
                const response = redirect("home");
                response.headers.set('Set-Cookie', `user_id=${userData[0].id}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict; Secure`);
                return response;
            } 
        }catch(error){
            console.error(error)
        }
    }
}

export default function Login({loaderData}: Route.ComponentProps){
    const {bases, orgs} = loaderData;
    const [baseList, setBaseList] = useState(bases);
    const [orgList, setOrgList] = useState(orgs);
    const [selectedBase, setSelectedBase] = useState("");
    const [selectedOrg, setSelectedOrg] = useState("");
    const [showLogin, setShowLogin] = useState(true);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const actionData = useActionData();
    const [showEmailError, setShowEmailError] = useState(false);
    const [filteredOrgList, setFilteredOrgList] = useState([]);
    const [baseOrg, setBaseOrg] = useState<"base" | "org" >("org")

    useEffect(() => {
        if(actionData && !actionData.success){
            setShowEmailError(true);
        }
    }, [actionData])

    function handleBaseChange(e){
        const newList = orgList.filter((org: { base_id: string; }) => org.base_id === e)
        setFilteredOrgList(newList)
        setBaseOrg('base')
        setSelectedBase(e)
    }

    function handleOrgChange(e){
        setBaseOrg('org')
        setSelectedOrg(e)
    }

    return (
        <div className="w-full h-screen flex justify-center items-center bg-linear-to-br from-blue-400 to-teal-300">
            {showLogin && 
            <Card className="w-1/3 shadow-xl flex flex-col items-center">
                <Form method="POST" className="w-full">
                    
                <CardHeader className="w-full text-center">
                    <p className="text-3xl font-semibold">Virtual Directory</p>
                </CardHeader>
                <CardContent className="w-full space-y-2">
                    <InputWithLabel label="Email" type="email" value={email} setter={setEmail} name="email"/>
                    <InputWithLabel label="Password" type="password" value={password} setter={setPassword} name="password" />
                    
                </CardContent>
                <CardFooter className="w-full flex flex-col items-center justify-center space-y-2">
                    <Button variant={'default'} className="w-full bg-blue-400" name="_action" type="submit" value="login">Login</Button>
                    <Button variant={'outline'} className="w-full" onClick={() => setShowLogin(false)}>Register</Button>
                </CardFooter>
                </Form>
            </Card>}
            {!showLogin && <Card className="lg:w-1/3 w-full mx-40 shadow-xl">
                <Form method="POST">
                <CardHeader className="text-2xl">
                    Register
                </CardHeader>
                <CardContent className="">
                    <InputWithLabel label="Email" type="email" value={email} setter={setEmail} name="email"/>
                    {showEmailError && <p className="text-red-500 text-xs -mt-3 ml-0.5">Email already in use.</p>}
                    <InputWithLabel label="Password" type="password" value={password} setter={setPassword} name="password"/>
                    <div className="pt-2">
                        <Tabs defaultValue="organization">
                            <TabsList>
                                <TabsTrigger value="organization">Organization Admin</TabsTrigger>
                                <TabsTrigger value="base">Base Admin</TabsTrigger>
                            </TabsList>
                            <TabsContent value="organization" className="space-y-4 mt-3">
                                <p>Select your base:</p>
                                <Select onValueChange={(e) => handleBaseChange(e)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {baseList.sort((a, b) => a.name.localeCompare(b.name)).map((base, index) => <SelectItem value={base.id} key={index}>{base.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {selectedBase && <>
                                <p>Select an organization:</p>
                                <Select onValueChange={(e) => handleOrgChange(e)}>
                                    <SelectTrigger className="w-full">
                                       <SelectValue placeholder="..."/>
                                    </SelectTrigger>
                                    <SelectContent >
                                        {filteredOrgList.sort((a, b) => a.name.localeCompare(b.name)).map((org, index) => <SelectItem value={org.id} key={index}>{org.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div>
                                    <p className="italic text-gray-600">Don't see your organization?</p>
                                    <p>Enter the name of your organization:</p>
                                    <input type="text" className="w-full mt-4 border rounded-lg py-1 pl-2" name="newOrg"/>
                                </div>
                                </>}
                            </TabsContent>
                            <TabsContent value="base" className="space-y-4 mt-3">
                                <p>Select your base: </p>
                                <Select onValueChange={(e) => handleBaseChange(e)}>
                                    <SelectTrigger className="w-full" >
                                        <SelectValue placeholder="..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {baseList.sort((a, b) => a.name.localeCompare(b.name)).map((base, index) => <SelectItem key={index} value={base.id}>{base.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TabsContent>
                        </Tabs>
                        
                    </div>
                    <input type="hidden" name="base" value={selectedBase} />
                    <input type="hidden" name="org" value={selectedOrg} />
                    <input type="hidden" name="type" value={baseOrg} />
                </CardContent>
                <hr className="my-4"/>
                <CardFooter className="flex flex-col gap-y-2">
                    <Button variant="default" className="w-full bg-blue-400 border-2 border-blue-500 hover:bg-blue-600" name="_action" value="register" type="submit">Create Account</Button>
                    <Button variant={'outline'} className="w-full" onClick={() => setShowLogin(true)}>Back to Login</Button>
                </CardFooter>
                </Form>
            </Card>}
        </div>
    );
}