
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Form, redirect, type ActionFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import Cookies from 'js-cookie'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const _action = formData.get("_action");
    const email = formData.get("email");
    const password = formData.get("password");

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
}

export default function Login({}){
    const [showLogin, setShowLogin] = useState(true);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

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
            {!showLogin && <Card className="w-1/3 shadow-xl">
                <CardHeader className="text-2xl">
                    Register
                </CardHeader>
                <CardContent>
                    <Button variant={'outline'} className="w-full" onClick={() => setShowLogin(true)}>Login</Button>
                </CardContent>
            </Card>}
        </div>
    );
}