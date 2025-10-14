import type { Route } from "./+types/home";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Form, redirect, useNavigate, useRouteLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import {  useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import FileInput, { type FileInputProps } from "~/components/FileUpload";
import { OrgCard } from "~/components/OrgCard";
import { Building } from "lucide-react";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie');
  if(!cookieHeader){
    return redirect('login');
  }
   const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            acc[name] = decodeURIComponent(value);
        }
        return acc;
    }, {} as Record<string, string>);

  const url = new URL(request.url);
  const selectedOrg = url.searchParams.get('org');

  if(selectedOrg){
    const {data} = await supabase.from('organization').select().eq('id', selectedOrg).eq('user_id', cookies.user_id);
    // console.log(data[0])
    return {orgData: data[0]}
  }
  return {}
}

export const action = async ({request}: ActionFunctionArgs) => {
    const formData = await request.formData();
    const id = formData.get('id');
    const name = formData.get("name");
    const description = formData.get("description");
    const poc = formData.get("poc");
    const badge = formData.get("badge");
    const _action = formData.get("_action");
    const image = formData.get("logo") as File;
    const primary = formData.get("primary");
    const secondary = formData.get("secondary");
    const text = formData.get("text");

    if(_action === "submit"){
      try{
        const { error } = await supabase.from("organization").update({name: name, description: description, contact: poc, type: badge, primary_color: primary, secondary_color: secondary, text_color: text}).eq('id', id);
        let imageUrl = null;
        if(image && image.size > 0 ){
          // console.log('test: ', image)
          const fileExt = image.name.split('.').pop();
          const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const {data: uploadData,error: uploadError} = await supabase.storage
            .from('images')
            .upload(filename, image, {
              cacheControl: '3600',
              upsert: false
            });

          // console.log("ud: ", uploadData)
          if(uploadError) {
            console.error("upload error: ", uploadError);
            return {success: false, error: uploadError.message};
          }

          const {data: urlData} = supabase.storage
            .from('images')
            .getPublicUrl(filename);

          imageUrl = urlData.publicUrl;

          const { error: updateError } = await supabase.from("organization").update({image_url: imageUrl}).eq('id', id);
          if(updateError){
            console.error("update error: ", updateError);
            return {success: false, error: updateError.message};
          }

        }

      }catch(error){
        console.error(error);
      }
    }
    // console.log(formData)
}

export default function Home({ loaderData}: Route.ComponentProps) {

  const {orgs} = useRouteLoaderData('header') ;
  const navigate = useNavigate();

  return (
    <div className="bg-linear-to-br from-blue-400 to-teal-300 p-6 h-screen">
      <Card className=" shadow-lg">
        <CardContent className="">
          <h1>You are the editor of {orgs.length} organization(s)</h1>
        </CardContent>
      </Card>
      <div className="grid grid-cols-[auto_auto_auto_auto_auto] w-full gap-4 mt-4">
        {orgs.map(org => 
          <Card key={org.id} className="w-30 h-30 items-center justify-center shadow-lg border-2 border-gray-200" onClick={() => navigate(`/admin/org?org=${org.id}`, {replace: true})}>
            <CardContent>
              {org.image_url ? <img src={org.image_url} width={100} height={100}/> : <Building size={50}/>}
              
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
