
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Form, redirect, useActionData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import Cookies from 'js-cookie'
import { Separator } from "@radix-ui/react-dropdown-menu";
import type { Route } from "../+types/root";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const loader = async ({}: LoaderFunctionArgs) => {
    const {data: bases} = await supabase.from("base").select()
    return {bases}
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const _action = formData.get("_action");
    const email = formData.get("email");
    const password = formData.get("password");
    const base = formData.get("base");

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
        try{
            const {data, error} = await supabase.from("user").select().eq("email", email)
            console.log("data: ", data, " error: ", error)
            if(data && data.length){
                return {success: false, message:"email address already exists"}
            }
            else{
                const {data, error} = await supabase.from("user").insert({"email": email, "password": password, "current_base": base}).select("id")
                const response = redirect("home");
                    response.headers.set('Set-Cookie', `user_id=${data[0].id}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict; Secure`);
                    return response;
            }

        }catch(error){
            console.error(error)
        }
    }
}

export default function Login({loaderData}: Route.ComponentProps){
    const {bases} = loaderData;
    const [baseList, setBaseList] = useState(bases);
    const [selectedBase, setSelectedBase] = useState("");
    const [showLogin, setShowLogin] = useState(true);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const actionData = useActionData();
    const [showEmailError, setShowEmailError] = useState(false);

    useEffect(() => {
        if(actionData && !actionData.success){
            setShowEmailError(true);
        }
    }, [actionData])

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
            {!showLogin && <Card className="w-fit shadow-xl">
                <Form method="POST">
                <CardHeader className="text-2xl">
                    Register
                </CardHeader>
                <CardContent className="">
                    <InputWithLabel label="Email" type="email" value={email} setter={setEmail} name="email"/>
                    {showEmailError && <p className="text-red-500 text-xs -mt-3 ml-0.5">Email already in use.</p>}
                    <InputWithLabel label="Password" type="password" value={password} setter={setPassword} name="password"/>
                    <div className="">
                        <p>Your base: </p>
                        <select className="bg-gray-200 p-1 border rounded-md" onChange={(e) => setSelectedBase(e.currentTarget.value)}>
                            <option>Select a base</option>
                            {baseList.map((base, index) => <option key={index} value={base.id}>{base.name}</option>)}
                        </select>
                    </div>
                    <input type="hidden" name="base" value={selectedBase} />
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