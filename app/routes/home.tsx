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
  const baseId = url.searchParams.get('id');
  
  if(!baseId){
    return redirect("login");
  }

  // SUPERADMIN CASE: No base/org assignment, just pull all requests
  if(baseId === 'superadmin'){
    const { data: allRequests, error: requestsError } = await supabase
      .from("request")
      .select();
    
    const { data: allBases, error: basesError } = await supabase
      .from('base')
      .select("id, name");
    
    const { data: allUsers, error: usersError } = await supabase
      .from('user')
      .select();

    const { data: allOrgs, error: orgsError} = await supabase
      .from('organization')
      .select();
    
    return { 
      isSuperAdmin: true,
      allRequests, 
      allBases, 
      allUsers,
      allOrgs,
    };
  }

  // BASE ADMIN CASE: Has base assignment
  const { data: orgData, error: orgError } = await supabase
    .from('organization')
    .select()
    .eq("user_id", cookies.user_id);
  
  // If user has organizations, redirect them to org view
  if(orgData?.length){
    return { orgData };
  }

  // Otherwise, load base admin data
  const { data: baseData, error: baseError } = await supabase
    .from('baseDetails')
    .select(`*, base (*)`)
    .eq('user_id', cookies.user_id)
    .single();
  
  const { data: orgsByBase, error: orgBaseError } = await supabase
    .from('organization')
    .select()
    .eq('base_id', baseData.base_id);
  
  const orgList = orgsByBase?.map(org => org.id) || [];
  
  const { data: orgRequests, error: orgRequestError } = await supabase
    .from('request')
    .select()
    .or(`base_id.eq.${baseId},org_id.in.(${orgList})`);
  
  const { data: allUsers, error: usersError} = await supabase
    .from('user')
    .select()
    .eq("current_base", baseId);
  
  return {
    isSuperAdmin: false,
    baseData, 
    orgsByBase, 
    orgRequests, 
    allUsers
  };
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
  const request_type = formData.get("request_type");

  if(_action === "submit"){
    try{
      const { error } = await supabase
        .from("organization")
        .update({
          name: name, 
          description: description, 
          contact: poc, 
          type: badge, 
          primary_color: primary, 
          secondary_color: secondary, 
          text_color: text
        })
        .eq('id', id);
      
      let imageUrl = null;
      if(image && image.size > 0){
        const fileExt = image.name.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const {data: uploadData, error: uploadError} = await supabase.storage
          .from('images')
          .upload(filename, image, {
            cacheControl: '3600',
            upsert: false
          });

        if(uploadError) {
          console.error("upload error: ", uploadError);
          return {success: false, error: uploadError.message};
        }

        const {data: urlData} = supabase.storage
          .from('images')
          .getPublicUrl(filename);

        imageUrl = urlData.publicUrl;

        const { error: updateError } = await supabase
          .from("organization")
          .update({image_url: imageUrl})
          .eq('id', id);
        
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
    const { org_id, request_id, _action, user_id, base_id, ...updateObj } = Object.fromEntries(formData);
    
    try{
      if(updateObj.request_type === "create-org"){
        const { data: existingOrgData, error: existingOrgError } = await supabase
          .from('organization')
          .select()
          .eq("name", updateObj.newOrg);
        
        if(existingOrgData?.length !== 0) return {existingOrgError};
        
        const { data: createOrgData, error: createOrgError } = await supabase
          .from('organization')
          .insert({
            "name": updateObj.newOrg, 
            "base_id": base_id, 
            "type": "SUPPORT", 
            "user_id": user_id
          })
          .select("id");
        
        await supabase.from('request').delete().eq('id', request_id);
        await supabase
          .from('user')
          .update({
            'admin_id': createOrgData[0].id, 
            'verified': new Date(Date.now())
          })
          .eq('id', user_id);
      } else if(updateObj.request_type === "base-admin"){
        await supabase
          .from('user')
          .update({
            "verified": new Date(Date.now()), 
            "admin_id": base_id
          })
          .eq("id", user_id);
        
        await supabase.from('request').delete().eq('id', request_id);
        await supabase.from('baseDetails').insert({"base_id": base_id, "user_id": user_id});
        await supabase.from('appFields').insert({"base_id": base_id});
      } else {
        await supabase
          .from('organization')
          .update(updateObj)
          .eq("id", org_id);
        
        await supabase.from('request').delete().eq('id', request_id);
      }      
    }catch (error){
      console.error(error);
    }
  }
  
  if(_action === 'deny'){
    // Handle deny action
  }
}

export default function Home({ loaderData}: Route.ComponentProps) {
  const {
    isSuperAdmin,
    allRequests,
    allBases,
    orgRequests, 
    allUsers, 
    allOrgs,
    orgsByBase, 
    baseData, 
    orgData
  } = loaderData;
  
  const navigate = useNavigate();
  const [orgHover, setOrgHover] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<string[]>(['create-org', 'org-admin', 'base-admin', 'org-update', 'base-update'])

  useEffect(() => {
    if(orgData && orgData.length){
      navigate(`org?id=${orgData[0].id}`);
    }
  }, []);

  // SUPERADMIN VIEW: No tabs, just requests
  if(isSuperAdmin){
    return (
      <div className="px-6 flex-1">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl pl-1 font-bold">All Requests</h2>
          <FilterByType filterBy={filterBy} setFilterBy={setFilterBy} isSuperAdmin/>
          {allRequests && allRequests.length > 0 ? (
            allRequests.filter(item => filterBy.includes(item.request_type)).map(request => (
              <div key={request.id} className="lg:grid grid-cols-3 md:flex md:flex-col">
                <RequestCard 
                  request={request} 
                  allUsers={allUsers} 
                  allOrgs={allOrgs}
                  allBases={allBases}
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground pl-1">No requests found.</p>
          )}
        </div>
      </div>
    );
  }

  // BASE ADMIN VIEW: With tabs
  return (
    <div className="px-6 flex-1">
      {baseData ? (
        <Tabs defaultValue="requests">
          <TabsList className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <TabsTrigger 
              value="requests" 
              className="data-[state=active]:!bg-primary"
              onClick={() => navigate(`.?id=${baseData.base.id}`)}
            >
              Requests
            </TabsTrigger>
            <TabsTrigger 
              value="baseInfo" 
              className="data-[state=active]:!bg-primary"
              onClick={() => navigate(`base?id=${baseData.base.id}`)}
            >
              {baseData.base.name}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className="mt-2">
            <div className="flex flex-col gap-4">
              <FilterByType filterBy={filterBy} setFilterBy={setFilterBy}/>
              {orgRequests && orgRequests.length > 0 ? (
                orgRequests.map(request => (
                  <div key={request.id} className="lg:grid grid-cols-3 md:flex md:flex-col">
                    <RequestCard 
                      request={request} 
                      allUsers={allUsers} 
                      allOrgs={orgsByBase}
                    />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No requests found.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="baseInfo">
            <Outlet />
          </TabsContent>
        </Tabs>
      ) : (
        <Outlet />
      )}
    </div>
  );
}