import type { Route } from "./+types/home";
import { Form, Outlet, redirect, useFetcher, useNavigate, useSearchParams, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import FilterByType from "~/components/FilterByType";
import RequestCard from "~/components/RequestCard";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { categories, REASONS, requests } from "~/lib/constants";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Edit2, SaveIcon, X, XIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie');
  console.log('header: ', cookieHeader)
  if (!cookieHeader) {
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
  console.log('baseId: ', baseId)
  if (!baseId) {
    return redirect("login");
  }

  // SUPERADMIN CASE: No base/org assignment, just pull all requests
  if (baseId === 'superadmin') {
    const { data: allRequests, error: requestsError } = await supabase
      .from("request")
      .select()
      .eq("is_denied", false);

    const { data: allBases, error: basesError } = await supabase
      .from('base')
      .select("id, name");

    const { data: allUsers, error: usersError } = await supabase
      .from('user')
      .select();

    const { data: allOrgs, error: orgsError } = await supabase
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
  if (orgData?.length) {
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
    .eq('base_id', baseData.
      base_id);

  const orgList = orgsByBase?.map(org => org.id) || [];

  const { data: orgRequests, error: orgRequestError } = await supabase
    .from('request')
    .select()
    .in('org_id', orgList)
    .eq("is_denied", false);
  // .or(`base_id.eq.${baseId},org_id.in.(${orgList})`);

  const { data: allUsers, error: usersError } = await supabase
    .from('user')
    .select()
    .eq("current_base", baseId);

  return {
    isSuperAdmin: false,
    baseData,
    allOrgs: orgsByBase,
    orgRequests,
    allUsers
  };
}

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const id = formData.get('id');
  const name = formData.get("name");
  const description = formData.get("description");
  const poc = formData.get("poc");
  const badge = formData.get("badge");
  const _action = formData.get("_action");
  const image = formData.get("logo") as File;
  const org_id = formData.get("org_id");
  const requestId = formData.get("request_id");
  const request_type = formData.get("request_type");
  const image_url = formData.get("image_url");
  const newLinksStr = formData.get('links');
  const newLinks = newLinksStr ? JSON.parse(newLinksStr as string) : [];
  console.log('pre if: ', formData)
  if (_action === "submit") {
    try {
      const { data, error } = await supabase
        .from("organization")
        .update({
          id: org_id,
          name: name,
          description: description,
          contact: poc,
          type: badge,
        })
        .eq('id', id);
      console.log('post update', data, error)

      let imageUrl = null;
      if (image && image.size > 0) {
        const fileExt = image.name.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filename, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("upload error: ", uploadError);
          return { success: false, error: uploadError.message };
        }

        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filename);

        imageUrl = urlData.publicUrl;

        const { error: updateError } = await supabase
          .from("organization")
          .update({ image_url: imageUrl })
          .eq('id', id);

        if (updateError) {
          console.error("update error: ", updateError);
          return { success: false, error: updateError.message };
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (_action === 'approve') {
    const { org_id, request_id, _action, user_id, base_id, ...updateObj } = Object.fromEntries(formData);

    try {
      if (updateObj.request_type === "create-org") {
        const { data: existingOrgData, error: existingOrgError } = await supabase
          .from('organization')
          .select()
          .eq("name", updateObj.newOrg);

        if (existingOrgData?.length !== 0) return { existingOrgError };

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

        return {success: true, _action: "approve"}
      } else if (updateObj.request_type === "base-admin") {
        await supabase
          .from('user')
          .update({
            "verified": new Date(Date.now()),
            "admin_id": base_id
          })
          .eq("id", user_id);

        await supabase.from('request').delete().eq('id', request_id);
        await supabase.from('baseDetails').insert({ "base_id": base_id, "user_id": user_id });
        await supabase.from('appFields').insert({ "base_id": base_id });
        return {success: true, _action: "approve"}
      } else if (request_type === "base-update") {
        console.log('obj', Object.fromEntries(formData.entries()))
        const { org_id, request_id, request_type, _action, ...obj } = Object.fromEntries(formData.entries())
        // delete updateObj.request_type
        console.log('test', obj)
        const { data: updateData, error: updateError } = await supabase
          .from('baseDetails')
          .update(obj)
          .eq("base_id", base_id)
        console.log('data: ', updateData, ' error: ', updateError)
        const { data: deleteData, error: deleteError } = await supabase
          .from('request')
          .delete()
          .eq('id', request_id)
        console.log('data: ', deleteData, ' error: ', deleteError)
        return {success: true, _action: "approve"}
      }
      else {
        console.log('update Object: ', updateObj)

        delete updateObj.request_type;
        
        // const oldLinks = JSON.parse(currentLinks?.links)
        //const newLinks = JSON.parse(updateObj.links)
        // if(newLinks){
        //   const {data: currentLinks} = await supabase.from('organization').select('links').eq('id', org_id).single();
        //   updateObj.links = [...newLinks, ...(currentLinks?.links || [])]
        // }

        const { error } = await supabase
          .from('organization')
          .update(updateObj)
          .eq("id", org_id);
        console.log(error)
        const {data: requestData, error: requestError} = await supabase.from('request').delete().eq('id', request_id);
        console.log(requestData, requestError)
        return {success: true, _action: "approve"}
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (_action === 'deny') {
    // Handle deny action
    const { data: updateData, error: updateError } = await supabase.from('request').update({ "is_denied": true }).eq("id", requestId)
    console.log(updateData, updateError)
    return {success: true, _action: "deny"}
  }
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
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

  // console.log('loaderData: ', loaderData)
  const navigate = useNavigate();
  const [orgHover, setOrgHover] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<string[]>(['create-org', 'org-admin', 'base-admin', 'org-update', 'base-update'])
  const [selectedRequest, setSelectedRequest] = useState<{ base_id: string, created_at: string, data: any, denial_reason: string, id: string, is_denied: boolean, org_id: string, request_type: string, user_id: string } | null>(null);
  const detailsFetcher = useFetcher();
  const [fetchedData, setFetchedData] = useState(null)
  const [showDenyForm, setShowDenyForm] = useState(false)
  const [denialSelect, setDenialSelect] = useState("")

  useEffect(() => {
    if (orgData && orgData.length) {
      navigate(`org?id=${orgData[0].id}`);
    }
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      detailsFetcher.load(`/details?id=${selectedRequest.base_id ?? selectedRequest.org_id}`);
    } else {
      setFetchedData(null)
    }
  }, [selectedRequest])

  useEffect(() => {
    if (detailsFetcher.state === 'idle' && detailsFetcher.data) {
      setFetchedData(detailsFetcher.data.data);
    }
    console.log('dF: ', detailsFetcher)
  }, [detailsFetcher])

  useEffect(() => {
    if(actionData && actionData.success){
      setSelectedRequest(null);
    }
  },[actionData])

  function orgNameForId(id: string) {
    console.log('tests: ', allOrgs)
    console.log('org: ', allOrgs?.filter(org => org.id === id))
    return allOrgs?.filter(org => org.id === id)[0].name
  }

  function emailForId(id: string) {
    console.log('users: ', allUsers)
    return allUsers?.find(user => user.id === id)?.email
  }

  function baseForId(id: string) {
    return allBases?.filter(base => base.id === id)[0].name
  }

  function labelForId(request: any) {
    const type = request.request_type.includes("org")
    console.log('type; ', type)
    if (type) {
      console.log('returned: ', orgNameForId(request.org_id))
      return orgNameForId(request.org_id);
    } else {
      return baseForId(request.base_id);
    }
  }
  console.log('selected request: ', selectedRequest)
  // Add this component above your main component
  function FieldDisplay({
    fieldKey,
    value,
    categories,
    incoming,
    originalValue,
  }: {
    fieldKey: string;
    value: string;
    categories: Array<{ type: string; color: string }>;
    incoming?: boolean;
    originalValue: string;
  }) {
    const label = fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1);
    const [newValue, setNewValue] = useState<string>(value);
    const [edit, setEdit] = useState(false);
    const hasChanged = newValue !== originalValue;
    function handleSave(){
      setEdit(false)
    }

    return (
      <div className="flex flex-col gap-1.5">
        <div className="inline-flex justify-between">
          <p className="text-sm font-medium text-foreground pb-1">{label}</p>
          {(incoming && !edit) && <div className="" onClick={() => setEdit(true)}><Edit2 width={14}/></div>}
          {(incoming && edit) && <div className="flex gap-2"><SaveIcon onClick={handleSave} width={14}/><X onClick={() => {setNewValue(value); setEdit(false)}} width={14}/></div>}
        </div>
        {fieldKey === "type" ? (
          <Badge
            variant="outline"
            className={`w-fit py-1.5 px-3 shadow-sm ${categories.find((c) => c.type === value)?.color}`}
          >
            {value}
          </Badge>
        ) : (
          <>
          {(incoming && !edit) ? <p className={`border ${hasChanged && 'border-yellow-400'} rounded-md px-3 py-2 bg-muted/50 text-sm`}>
            {newValue}
          </p> : <input type="text" className="border rounded-md px-3 py-2 bg-muted/50 text-sm" value={newValue} name={fieldKey} onChange={(e) => setNewValue(e.currentTarget.value)}/>}
          </>
        )}
        {(incoming) && <input type="hidden" name={fieldKey} value={newValue || originalValue}/>}
      </div>
    );
  }

  // SUPERADMIN VIEW: No tabs, just requests
  if (isSuperAdmin) {
    return (
      <div className="px-6 flex-1">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl pl-1 font-bold">All Requests</h2>
          <FilterByType filterBy={filterBy} setFilterBy={setFilterBy} isSuperAdmin />
          {allRequests && allRequests.length > 0 ? (
            <div className="lg:grid grid-cols-3 gap-4 md:flex md:flex-col">
              {allRequests.filter(item => filterBy.includes(item.request_type)).map(request => (
                <RequestCard
                  request={request}
                  allUsers={allUsers}
                  allOrgs={allOrgs}
                  allBases={allBases}
                  setSelectedRequest={setSelectedRequest}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground pl-1">No requests found.</p>
          )}
        </div>
        {selectedRequest &&
              <Form method="POST" >
        <div className="absolute inset-0 w-full h-screen flex items-center justify-center bg-black/20 backdrop-blur-xs">
          <Card className="relative flex w-2/3 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            <CardHeader>
              <div className="flex justify-between">
                <div className="inline-flex gap-2">
                <p>{requests[selectedRequest.request_type].labelFull + " - "}</p>
                <Badge variant={"outline"}>{labelForId(selectedRequest)}</Badge>
                </div>
                <div className="-mr-2 -mt-2 text-white/30">
                  <XIcon size={20} onClick={() => {setDenialSelect(""); setShowDenyForm(false); setSelectedRequest(null);}}/>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">

              {/* Current Data Column */}
              <div className="flex flex-col pr-6 border-r">
                <p className="text-sm font-semibold text-muted-foreground mb-4">Current</p>
                <div className="flex flex-col gap-3">
                  {fetchedData && Object.entries(fetchedData).map(([key, value]) => {
                    if (!(key in selectedRequest.data) || key === "orgId" || key === "userId") {
                      return null;
                    }
                    return <FieldDisplay key={key} fieldKey={key} value={value} categories={categories} originalValue={value}/>;
                  })}
                  { !fetchedData && <div className="flex flex-col pr-6 gap-2">
                    <Skeleton className="h-5 w-24"/>
                    <Skeleton className="h-7 w-full"/>
                    </div>}
                </div>
              </div>

              {/* Incoming Data Column */}
              <div className="flex flex-col pl-2">
                <p className="text-sm font-semibold text-muted-foreground mb-4">Incoming</p>
                <div className="flex flex-col gap-3">
                  {Object.entries(selectedRequest.data).map(([key, value]) => {
                    if (key === "orgId" || key === "userId" || key === 'baseId' || key === "request-type") {
                      return null;
                    }
                    return <FieldDisplay key={key} fieldKey={key} value={value} categories={categories} incoming/>;
                  })}
                </div>
              </div>
              <input type="hidden" name="org_id" value={selectedRequest.org_id}/>
              <input type="hidden" name="request_id" value={selectedRequest.id} />
              
            </CardContent>
            <CardFooter className="flex flex-col w-full justify-center gap-4">
              <div className="flex gap-3">
                <Button type="submit" name="_action" value="approve" className="bg-blue-600 hover:bg-blue-700 text-white">Approve</Button>
                <Button variant={"ghost"} className="border-2 border-red-600 hover:bg-red-600/10 text-red-500 px-6 py-2" type="button" onClick={() => setShowDenyForm(!showDenyForm)}>Deny</Button>
              </div>
              {showDenyForm && <><div className="w-1/2">
                <Select onValueChange={(e) => setDenialSelect(e)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason"/>
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((item, index) => <SelectItem value={item} key={index}>{item}</SelectItem>)}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-1/2">
                {denialSelect === "Other" && <textarea className="bg-input w-full border rounded-lg" name="other-reason"/>}
              </div></>}
            </CardFooter>
          </Card>
          
        </div>
        </Form>}
      </div>
    );
  }

  // BASE ADMIN VIEW: With tabs
  return (
    <div className=" flex-1">
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
              <FilterByType filterBy={filterBy} setFilterBy={setFilterBy} />
              {orgRequests && orgRequests.length > 0 ? (
                orgRequests.map(request => (
                  <div key={request.id} className="lg:grid grid-cols-3 md:flex md:flex-col">
                    <RequestCard
                      request={request}
                      allUsers={allUsers}
                      allOrgs={allOrgs}
                      setSelectedRequest={setSelectedRequest}
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
      {selectedRequest &&
              <Form method="POST" >
        <div className="absolute inset-0 w-full h-screen flex items-center justify-center bg-black/20 backdrop-blur-xs">
          <Card className="relative flex w-2/3 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            <CardHeader>
              <div className="flex justify-between">
                <div className="inline-flex gap-2">
                <p>{requests[selectedRequest.request_type].labelFull + " - "}</p>
                <Badge variant={"outline"}>{labelForId(selectedRequest)}</Badge>
                </div>
                <div className="-mr-2 -mt-2 text-white/30">
                  <XIcon size={20} onClick={() => setSelectedRequest(null)}/>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">

              {/* Current Data Column */}
              <div className="flex flex-col pr-6 border-r">
                <p className="text-sm font-semibold text-muted-foreground mb-4">Current</p>
                <div className="flex flex-col gap-3">
                  {fetchedData && Object.entries(fetchedData).map(([key, value]) => {
                    if (!(key in selectedRequest.data) || key === "orgId" || key === "userId") {
                      return null;
                    }
                    return <FieldDisplay key={key} fieldKey={key} value={value} categories={categories} />;
                  })}
                </div>
              </div>

              {/* Incoming Data Column */}
              <div className="flex flex-col pl-2">
                <p className="text-sm font-semibold text-muted-foreground mb-4">Incoming</p>
                <div className="flex flex-col gap-3">
                  {Object.entries(selectedRequest.data).map(([key, value]) => {
                    if (key === "orgId" || key === "userId") {
                      return null;
                    }
                    return <FieldDisplay key={key} fieldKey={key} value={value} categories={categories} incoming/>;
                  })}
                </div>
              </div>
              <input type="hidden" name="org_id" value={selectedRequest.org_id}/>
              <input type="hidden" name="request_id" value={selectedRequest.id} />
            </CardContent>
            <CardFooter className="flex w-full justify-center gap-2">
              <Button type="submit" name="_action" value="approve" className="bg-blue-600 hover:bg-blue-700 text-white">Approve</Button>
              <Button variant={"ghost"} className="border-2 border-red-600 hover:bg-red-600/10 text-red-500 px-6 py-2" type="button" onClick={() => setSelectedRequest(null)}>Deny</Button>
            </CardFooter>
          </Card>
        </div>
        </Form>}
    </div>
  );
}