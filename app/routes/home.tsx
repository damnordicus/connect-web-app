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

  const {data: orgData, error: orgError} = await supabase.from('organization').select().eq("user_id", cookies.user_id)

  console.log('test', orgData)
  if(!orgData?.length){
    const { data: baseData, error: baseError } = await supabase.from('baseDetails').select(`*, base (*)`).eq('user_id', cookies.user_id)
    const { data: orgsByBase, error: orgBaseError } = await supabase.from('organization').select().eq('base_id', baseData[0].base_id);
    const orgList = orgsByBase?.map(org => org.id);
    const { data: orgRequests, error: orgRequestError } = await supabase.from('request').select().in('org_id', orgList);
    const { data: allUsers, error: usersError} = await supabase.from('user').select().eq("current_base", baseId)
    return {baseData, orgsByBase, orgRequests, allUsers}
  }

  // if(selectedOrg){
  //   const {data} = await supabase.from('organization').select().eq('id', selectedOrg).eq('user_id', cookies.user_id);
  //   return {orgData: data[0]}
  // }
  // if(baseId){
  //   const {data: orgList, error: orgError} = await supabase.from('organization').select('id').eq('base_id', baseId);
  //   const orgIds = orgList?.map(org => org.id);
  //   const {data: orgRequests, error: requestError} = await supabase.from('request').select('*').in('org_id', orgIds);
  //   const {data: orgsPerBase, error: orgBaseError} = await supabase.from('organization').select().eq("base_id", baseId);
  //   console.log("orgList: ", orgRequests)
  //   const {data: allUsers, error: usersError } = await supabase.from('user').select().eq("current_base", baseId)
  //   return {orgRequests, allUsers, orgsPerBase}
  // }
  return {orgData}
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

  // const {orgs, bases} = useRouteLoaderData('header') ;
  const {orgRequests, allUsers, orgsByBase, baseData, orgData } = loaderData;
  console.log('bD: ',orgData)
  const navigate = useNavigate();
  const [orgHover, setOrgHover] = useState<string | null>(null);
  // const details = bases[0].base;
  useEffect(() => {
    if(orgData && orgData.length){
      navigate(`org?id=${orgData[0].id}`)
    }
  }, [])

  return (
    <div className=" px-6  flex-1">
      {baseData && 
      <Tabs defaultValue={"requests"}>
        <TabsList className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <TabsTrigger value="requests" className="data-[state=active]:!bg-primary " onClick={() => navigate(`.?id=${baseData[0].base.id}`)}>Requests</TabsTrigger>
          <TabsTrigger value="baseInfo" className="data-[state=active]:!bg-primary" onClick={() => navigate(`base?id=${baseData[0].base.id}`)}>{baseData[0].base.name}</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-2">
            <div className="flex flex-col gap-4">
              <FilterByType />
              {(orgRequests && orgRequests.length > 0) && 
                orgRequests.map(request => 
                <div className="lg:grid grid-cols-3 md:flex md:flex-col">
                  <RequestCard request={orgRequests[0]} allUsers={allUsers} allOrgs={orgsByBase}/>
                </div>)}
            </div>
        </TabsContent>
        <TabsContent value="baseInfo">
          <Outlet />
        </TabsContent>
      </Tabs>}
      {!baseData && 
      <Outlet />
      }
    </div>
  )
}
