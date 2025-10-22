import type { Route } from "./+types/home";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Form, Outlet, redirect, useNavigate, useRouteLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import {  useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import FileInput, { type FileInputProps } from "~/components/FileUpload";
import { OrgCard } from "~/components/OrgCard";
import { Building } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import FilterByType from "~/components/FilterByType";
import RequestCard from "~/components/RequestCard";

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
  const baseId = url.searchParams.get('id')

  if(selectedOrg){
    const {data} = await supabase.from('organization').select().eq('id', selectedOrg).eq('user_id', cookies.user_id);
    return {orgData: data[0]}
  }
  if(baseId){
    const {data: orgList, error: orgError} = await supabase.from('organization').select('id').eq('base_id', baseId);
    const orgIds = orgList?.map(org => org.id);
    const {data: orgRequests, error: requestError} = await supabase.from('request').select('*').in('org_id', orgIds);
    const {data: orgsPerBase, error: orgBaseError} = await supabase.from('organization').select().eq("base_id", baseId);
    console.log("orgList: ", orgRequests)
    const {data: allUsers, error: usersError } = await supabase.from('user').select().eq("current_base", baseId)
    return {orgRequests, allUsers, orgsPerBase}
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

  const {orgs, bases} = useRouteLoaderData('header') ;
  const {orgRequests, allUsers, orgsPerBase } = loaderData;
  console.log('bD: ',orgRequests)
  const navigate = useNavigate();
  const [orgHover, setOrgHover] = useState<string | null>(null);
  const details = bases[0].base;

  return (
    <div className="bg-slate-400 px-6 py-3 flex-1">
      {bases && 
      <Tabs>
        <TabsList defaultValue={"requests"}>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="baseInfo" onClick={() => navigate(`base?id=${details.id}`)}>{details.name}</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-2">
            <div className="flex flex-col gap-4">
              <FilterByType />
              {(orgRequests && orgRequests.length > 0) && 
                orgRequests.map(request => 
                <div className="lg:grid grid-cols-3 md:flex md:flex-col">
                  <RequestCard request={orgRequests[0]} allUsers={allUsers} allOrgs={orgsPerBase}/>
                </div>)}
            </div>
        </TabsContent>
        <TabsContent value="baseInfo">
          <Outlet />
        </TabsContent>
      </Tabs>}
      
      <div className="grid grid-cols-[auto_auto_auto_auto_auto] w-full gap-4 mt-4">
        {orgs.map(org => {
          const isHovering = orgHover === org.id;
          return(
            <>
          {!isHovering ? <Card key={org.id}
            onMouseEnter={() => setOrgHover(org.id)}
            className={` w-30 h-30 items-center justify-center shadow-lg border-2 border-gray-200`} onClick={() => navigate(`/admin/org?org=${org.id}`, {replace: true})}>
            <CardContent>
              {org.image_url ? <img src={org.image_url} width={100} height={100}/> : <Building size={50}/>}
              
            </CardContent>
          </Card>
            :
           <Card key={org.id}
           onMouseLeave={() => setOrgHover(null)}
            className={` w-30 h-30 items-center text-left text-white justify-center shadow-lg bg-black/50 border-2 border-gray-800 -translate-y-1.5`} onClick={() => navigate(`/admin/org?org=${org.id}`, {replace: true})}>
            <CardContent>
             {org.name}
            </CardContent>
          </Card>}
              </>
          )
          }
        )}
      </div>
    </div>
  )
}
