import type { Route } from "./+types/home";
import { Form, Outlet, redirect, useNavigate, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import {  useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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
  if(url.searchParams.size > 0){
    const {data: orgData, error: orgError} = await supabase.from('organization').select().eq("user_id", cookies.user_id)
    
    console.log('test', orgData)
    if(!orgData?.length){
      const { data: baseData, error: baseError } = await supabase.from('baseDetails').select(`*, base (*)`).eq('user_id', cookies.user_id)
      console.log('bdata: ', baseData)
      const { data: orgsByBase, error: orgBaseError } = await supabase.from('organization').select().eq('base_id', baseData[0].base_id);
      const orgList = orgsByBase?.map(org => org.id);
      console.log(orgList)
      const { data: orgRequests, error: orgRequestError } = await supabase.from('request').select().in('org_id', orgList)//or(`base_id.eq.baseId, org_id.in.(${orgList})`);
      console.log('orgRequests', orgRequests)
      const { data: allUsers, error: usersError} = await supabase.from('user').select().eq("current_base", baseId)
      return {baseData, orgsByBase, orgRequests, allUsers}
    }
    return {orgData}
  }
  return redirect("login")
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
    const orgId = formData.get("orgId");
    const requestId = formData.get("request_id");

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
    if(_action === 'approve'){
      console.log(formData)
      const { org_id, request_id, _action, user_id, base_id, ...updateObj } = Object.fromEntries(formData)
      console.log('uO: ',user_id)
      try{
        if(updateObj.newOrg){
          const { data: existingOrgData, error: existingOrgError } = await supabase.from('organization').select().eq("name", updateObj.newOrg)
          if(existingOrgData?.length !== 0) return {existingOrgError}
          const { data: createOrgData, error: createOrgError } = await supabase.from('organization').insert({"name": updateObj.newOrg, "base_id": base_id, "type": "SUPPORT", "user_id": user_id}).select("id")
          console.log('cod', createOrgData)
          const {data: removeRequestData, error: removeRequestError} = await supabase.from('request').delete().eq('id', request_id)
          const {data: user, error: userError} = await supabase.from('user').update({'admin_id': createOrgData[0].id, 'verified': new Date(Date.now())}).eq('id', user_id)
          console.log(user, userError)
        }else{
          const { data: updateInfo, error: updateError } = await supabase.from('organization').update(updateObj).eq("id", org_id)
          console.log('info: ', updateInfo, 'error: ', updateError)
          const { data: removeRequestData, error: removeRequestError } = await supabase.from('request').delete().eq('id', request_id);
        }

      }catch (error){
        console.error(error);
      }
    }
    if(_action === 'deny'){

    }
    // console.log(formData)
}

export default function Home({ loaderData}: Route.ComponentProps) {

  // const {orgs, bases} = useRouteLoaderData('header') ;
  const {orgRequests, allUsers, orgsByBase, baseData, orgData } = loaderData;
  console.log('bD: ',orgRequests)
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
                  <RequestCard request={request} allUsers={allUsers} allOrgs={orgsByBase}/>
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
