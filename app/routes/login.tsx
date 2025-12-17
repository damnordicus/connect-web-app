
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, type SetStateAction } from "react";
import { Form, redirect, useActionData, useFetcher, useNavigate, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import type { Route } from "../+types/root";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "~/components/ui/tabs";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent} from "~/components/ui/select";
import toast from "react-hot-toast";


const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const loader = async ({}: LoaderFunctionArgs) => {
    const {data: bases} = await supabase.from("base").select();
    const {data: orgs} = await supabase.from("organization").select();
    return {bases, orgs}
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const _action = formData.get("_action");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const base = formData.get("base");
    const org = formData.get("org");
    const type = formData.get("type");
    const test = formData.get("test");
    const newOrg = formData.get("newOrg");

    if(_action === "login"){
       try{
            const {data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            })
            console.log(data?.length, error)
            if(error){
                return {success: false, error: "Invalid credentials"}
            }
            
            if (data ) {
                const {data: userConnect, error: userError} = await supabase.from("user").select("id, role, admin_id").eq("users_id", data.user?.id).single()
                
                if(userConnect?.role === "SUPERADMIN"){
                   return new Response(JSON.stringify(
                        {
                            success: true,
                            role: "SUPERADMIN",
                            userId: userConnect?.id
                        }),
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Set-Cookie': `user_id=${userConnect?.id}; Path=/; Max-Age=${7*24*60*60}; SameSite=Strict; Secure`
                            }
                        }
                    );
                }else{
                    const isSecureContext = request.url.startsWith('https://') || 
                        new URL(request.url).hostname === 'localhost';
                    const response = redirect(`/home?id=${userConnect?.admin_id}`);
                    response.headers.set('Set-Cookie', `user_id=${userConnect?.id}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isSecureContext ? '; Secure' : ''}`);
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
            const {data: signUpData, error: signUpError} = await authClient.signUp.email()
            const {data, error} = await supabase.from("user").select().eq("email", email)
            console.log("data: ", data, " error: ", error)
            if(data && data.length){
                return {success: false, message:"email address already exists"}
            }
            else{
                const {data: userData, error: userError} = await supabase.from("user").insert({"email": email, "password": password, "current_base": base, "role": test === 'base' ? 'BASE' : 'ORG'}).select().single();
                console.log(userData)
                if(userData){

                    if(newOrg && newOrg.length > 0){
                        const { data: newOrgData, error: newOrgError } = await supabase.from("request").insert({"created_at": new Date(Date.now()), "user_id": userData.id, "base_id": base, "data": {newOrg: newOrg, baseId: base}, "request_type": "create-org"});
                    }
                    if(test === "organization"){
                        const {data: requestResponse, error: insertError} = await supabase.from("request").insert({"created_at": new Date(Date.now()), "user_id": userData.id, "org_id": org, "request_type": "org-admin"})
                    }
                    if(test === "base"){
                        console.log('test')
                        const {data: requestResponse, error: insertError} = await supabase.from("request").insert({"created_at": new Date(Date.now()), "user_id": userData.id, "base_id": base, "request_type": "base-admin"})
                        console.log(requestResponse, insertError)
                    }
                }
                console.log('base: ', base, ' org: ', org)
                if(userData.admin_id){
                    return redirect(`home?id=${userData.admin_id}`)
                }else{
                    return redirect('/');
                }
            } 
        }catch(error){
            console.error(error)
        }
    }
}

export default function Login({loaderData, actionData}: Route.ComponentProps){
    const {bases, orgs} = loaderData;
    const [baseList, setBaseList] = useState(bases);
    const [orgList, setOrgList] = useState(orgs);
    const [selectedBase, setSelectedBase] = useState("");
    const [selectedOrg, setSelectedOrg] = useState("");
    const [showLogin, setShowLogin] = useState(true);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showEmailError, setShowEmailError] = useState(false);
    const [filteredOrgList, setFilteredOrgList] = useState([]);
    const [baseOrg, setBaseOrg] = useState<"base" | "org" >("org")
    const [register, setRegister] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if(actionData?.success){
            toast.success("Welcome Back!");
            if(actionData.role === "SUPERADMIN"){
                navigate("/home?id=superadmin");
            } else {
                navigate("/home")
            }
        }
    }, [actionData])

    function handleBaseChange(e: SetStateAction<string>){
        const newList = orgList.filter((org: { base_id: string; }) => org.base_id === e)
        setFilteredOrgList(newList)
        setBaseOrg('base')
        setSelectedBase(e)
    }

    function handleOrgChange(e: SetStateAction<string>){
        setBaseOrg('org')
        setSelectedOrg(e)
    }

    return (
        <div className="w-full h-screen flex justify-center items-center">
            {showLogin && 
            <Card className=" md:w-1/3 shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-lg flex flex-col items-center">
                <Form method="POST" className="w-full">
                    
                <CardHeader className="w-full text-center">
                    <p className="text-3xl font-semibold text-foreground">Virtual Directory</p>
                </CardHeader>
                <CardContent className="w-full space-y-2">
                    <InputWithLabel label="Email" type="email" value={email} setter={setEmail} name="email"/>
                    <InputWithLabel label="Password" type="password" value={password} setter={setPassword} name="password" />
                    {actionData?.error && <p className="text-red-500 text-sm mb-3 text-center">{actionData.error}</p>}
                </CardContent>
                <CardFooter className="w-full flex flex-col items-center justify-center space-y-2 pt-4">
                    <Button variant={'default'} className="w-full bg-primary hover:bg-blue-600" name="_action" type="submit" value="login">Login</Button>
                    <Button variant={'default'} className="w-full bg-secondary hover:bg-green-600" type="button" onClick={() => setShowLogin(false)}>Register</Button>
                </CardFooter>
                </Form>
            </Card>}
            {!showLogin && <Card className="lg:w-1/3 w-full mx-40 shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-lg">
                <Form method="POST">
                <CardHeader className="text-2xl">
                    Register
                </CardHeader>
                <CardContent className="">
                    <InputWithLabel label="Email" type="email" value={email} setter={setEmail} name="email"/>
                    {showEmailError && <p className="text-red-500 text-xs -mt-3 ml-0.5">Email already in use.</p>}
                    <InputWithLabel label="Password" type="password" value={password} setter={setPassword} name="password"/>
                    <div className="pt-2">
                        <Tabs defaultValue="organization" onValueChange={setRegister}>
                            <TabsList className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                                <TabsTrigger value="organization" className="data-[state=active]:!bg-primary">Organization Admin</TabsTrigger>
                                <TabsTrigger value="base" className="data-[state=active]:!bg-primary">Base Admin</TabsTrigger>
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
                    <input type="hidden" name="test" value={register} />
                </CardContent>
                <hr className="my-4"/>
                <CardFooter className="flex flex-col gap-y-2">
                    <Button variant="default" className="w-full bg-primary border-2 border hover:bg-blue-600" name="_action" value="register" type="submit">Create Account</Button>
                    <Button variant={'default'} className="w-full bg-secondary hover:bg-red-400" onClick={() => setShowLogin(true)}>Back to Login</Button>
                </CardFooter>
                </Form>
            </Card>}
        </div>
    );
}