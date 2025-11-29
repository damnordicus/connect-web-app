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
    .eq('base_id', baseData.base_id);

  const orgList = orgsByBase?.map(org => org.id) || [];

  const { data: orgRequests, error: orgRequestError } = await supabase
    .from('request')
    .select()
    .in('org_id', orgList)
    .eq("is_denied", false);

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
  const denialReason = formData.get("denial_reason");
  
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
        const { org_id, request_id, request_type, _action, table_data, delete_tables, ...obj } = Object.fromEntries(formData.entries())
        
        if(table_data){
          const {data: currentTables, error: existingError} = await supabase.from('appFields').select("table_data").eq("base_id", base_id).single();
          if(existingError) throw existingError
          const existingTables = currentTables?.table_data || [];
          const incomingTables = JSON.parse(table_data as string);
          const incomingTablesMap = new Map(incomingTables.map(table => [table.id, table]))
          const updatedTables = existingTables.map(table => 
            incomingTablesMap.has(table.id) 
              ? incomingTablesMap.get(table.id) 
              : table
          );
          incomingTables.forEach(table => {
            if (!existingTables.find(t => t.id === table.id)) {
              updatedTables.push(table);
            }
          });
          const { data, error } = await supabase.from('appFields').update({"table_data": updatedTables}).eq("base_id", base_id);
        }

        if(delete_tables){
          const {data: currentTables, error: existingError} = await supabase.from('appFields').select("table_data").eq("base_id", base_id).single();
          if(existingError) throw existingError
          const existingTables = currentTables?.table_data || [];
          const deleteTables = JSON.parse(delete_tables as string);
          const newTables = existingTables.filter(table => !deleteTables.includes(table.id))
          const {data, error} = await supabase.from('appFields').update({"table_data": newTables}).eq("base_id", base_id);
        }

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

        if(updateObj.delete_tables){
          const {data: currentTables, error: existingError} = await supabase.from('organization').select("table_data").eq("id", org_id).single();
          if(existingError) throw existingError
          const existingTables = currentTables?.table_data || [];
          const deleteTables = JSON.parse(updateObj.delete_tables as string);
          const newTables = existingTables.filter(table => !deleteTables.includes(table.id))
          const {data, error} = await supabase.from('organization').update({"table_data": newTables}).eq("id", org_id);
        }
        
        if(updateObj.table_data){
          updateObj.table_data = JSON.parse(updateObj.table_data as string)
        }
        if(updateObj.links){
          const parseLinks = JSON.parse(updateObj.links as string)
          updateObj.links = parseLinks
        }
        console.log(updateObj)

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
    const { data: updateData, error: updateError } = await supabase
      .from('request')
      .update({ 
        "is_denied": true,
        "denial_reason": denialReason 
      })
      .eq("id", requestId)
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

  const navigate = useNavigate();
  const [orgHover, setOrgHover] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<string[]>(['create-org', 'org-admin', 'base-admin', 'org-update', 'base-update'])
  const [selectedRequest, setSelectedRequest] = useState<{ base_id: string, created_at: string, data: any, denial_reason: string, id: string, is_denied: boolean, org_id: string, request_type: string, user_id: string } | null>(null);
  const detailsFetcher = useFetcher();
  const [fetchedData, setFetchedData] = useState(null)
  const [showDenyForm, setShowDenyForm] = useState(false)
  const [denialSelect, setDenialSelect] = useState("")
  const [customDenialReason, setCustomDenialReason] = useState("")

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
  }, [detailsFetcher])

  useEffect(() => {
    if(actionData && actionData.success){
      setSelectedRequest(null);
      setShowDenyForm(false);
      setDenialSelect("");
      setCustomDenialReason("");
    }
  },[actionData])

  function orgNameForId(id: string) {
    return allOrgs?.filter(org => org.id === id)[0]?.name
  }

  function emailForId(id: string) {
    return allUsers?.find(user => user.id === id)?.email
  }

  function baseForId(id: string) {
    return allBases?.filter(base => base.id === id)[0]?.name
  }

  function labelForId(request: any) {
    const type = request.request_type.includes("org")
    if (type) {
      return orgNameForId(request.org_id);
    } else {
      return baseForId(request.base_id);
    }
  }

  // Improved FieldDisplay component
  function FieldDisplay({
    fieldKey,
    value,
    categories,
    incoming,
    originalValue,
  }: {
    fieldKey: string;
    value: any;
    categories: Array<{ type: string; color: string }>;
    incoming?: boolean;
    originalValue?: any;
  }) {
    // Convert field key to readable label
    const label = fieldKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Parse value safely
    const parseValue = (val: any) => {
      if (val === null || val === undefined || val === "null" || val === "") return null;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    };

    const parsedValue = parseValue(value);
    const parsedOriginal = parseValue(originalValue);
    const [editedValue, setEditedValue] = useState(parsedValue);
    const [isEditing, setIsEditing] = useState(false);

    // Check if value has changed from original
    const hasChanged = incoming && parsedOriginal !== undefined && 
      JSON.stringify(editedValue) !== JSON.stringify(parsedOriginal);

    const handleSave = () => setIsEditing(false);
    const handleCancel = () => {
      setEditedValue(parsedValue);
      setIsEditing(false);
    };

    // Render different field types
    const renderField = () => {
      // Type badge
      if (fieldKey === "type") {
        return (
          <Badge
            variant="outline"
            className={`w-fit py-1.5 px-3 shadow-sm ${categories.find((c) => c.type === editedValue)?.color}`}
          >
            {editedValue}
          </Badge>
        );
      }

      // Table data
      if (fieldKey === "table_data") {
        const tables = Array.isArray(editedValue) ? editedValue : [];
        if (!tables.length) {
          return <p className="text-sm text-muted-foreground italic">No tables</p>;
        }
        return (
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {tables.map((table: any, index: number) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 border-b">
                  <p className="text-xs font-semibold">Table {index + 1}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {table.headers?.map((header: string, i: number) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold border-r last:border-r-0">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.data?.map((row: any[], i: number) => (
                        <tr key={i} className="hover:bg-muted/30 border-t">
                          {row.map((cell: any, j: number) => (
                            <td key={j} className="px-3 py-2 border-r last:border-r-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        );
      }

      // Links
      if (fieldKey === "links") {
        const links = Array.isArray(editedValue) ? editedValue : [];
        if (!links.length) {
          return <p className="text-sm text-muted-foreground italic">No links</p>;
        }
        return (
          <div className="space-y-2">
            {links.map((link: any, idx: number) => (
              <div key={idx} className="border rounded-md px-3 py-2 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">{link.label}</p>
                <a 
                  href={link.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {link.link}
                </a>
              </div>
            ))}
          </div>
        );
      }

      // Delete tables (show list of table IDs to be deleted)
      if (fieldKey === "delete_tables") {
        const tableIds = Array.isArray(editedValue) ? editedValue : [];
        if (!tableIds.length) {
          return <p className="text-sm text-muted-foreground italic">No tables to delete</p>;
        }
        return (
          <div className="space-y-1">
            {tableIds.map((id: string, idx: number) => (
              <p key={idx} className="text-sm border rounded-md px-3 py-1.5 bg-red-50 text-red-700">
                Table ID: {id}
              </p>
            ))}
          </div>
        );
      }

      // Editable text fields (for incoming data only)
      if (incoming && isEditing) {
        return (
          <textarea
            className="w-full border rounded-md px-3 py-2 bg-background text-sm min-h-[60px] resize-y"
            value={editedValue ?? ''}
            onChange={(e) => setEditedValue(e.target.value)}
          />
        );
      }

      // Regular text display
      return (
        <div 
          className={`border rounded-md px-3 py-2 bg-muted/30 text-sm ${
            hasChanged ? 'border-yellow-400 bg-yellow-50' : ''
          }`}
        >
          {editedValue ? (
            <p className="whitespace-pre-wrap break-words">{editedValue}</p>
          ) : (
            <span className="text-muted-foreground italic">No data</span>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {hasChanged && (
            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
              Changed
            </Badge>
          )}
          {incoming && !isEditing && !["type", "table_data", "links", "delete_tables"].includes(fieldKey) && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 width={14} />
            </button>
          )}
          {incoming && isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="text-green-600 hover:text-green-700"
              >
                <SaveIcon width={14} />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700"
              >
                <X width={14} />
              </button>
            </div>
          )}
        </div>
        {renderField()}
        {incoming && (
          <input
            type="hidden"
            name={fieldKey}
            value={typeof editedValue === 'object' && editedValue !== null
              ? JSON.stringify(editedValue)
              : (editedValue ?? '')}
          />
        )}
      </div>
    );
  }

  // Modal Component
  const RequestModal = () => {
    if (!selectedRequest) return null;

    const finalDenialReason = denialSelect === "Other" ? customDenialReason : denialSelect;

    return (
      <Form method="POST">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{requests[selectedRequest.request_type].labelFull}</h3>
                    <Badge variant="outline">{labelForId(selectedRequest)}</Badge>
                  </div>
                  {emailForId(selectedRequest.user_id) && (
                    <p className="text-sm text-muted-foreground">
                      Requested by: {emailForId(selectedRequest.user_id)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setShowDenyForm(false);
                    setDenialSelect("");
                    setCustomDenialReason("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Current Data Column */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Current
                    </p>
                  </div>
                  {!fetchedData ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(fetchedData).map(([key, value]) => {
                        if (!(key in selectedRequest.data) || key === "orgId" || key === "userId" || key === "baseId") {
                          return null;
                        }
                        return (
                          <FieldDisplay
                            key={key}
                            fieldKey={key}
                            value={value}
                            categories={categories}
                            originalValue={value}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Incoming Data Column */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-1 rounded-full bg-blue-600" />
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                      Proposed Changes
                    </p>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(selectedRequest.data).map(([key, value]) => {
                      if (key === "orgId" || key === "userId" || key === "baseId" || key === "request-type") {
                        return null;
                      }
                      return (
                        <FieldDisplay
                          key={key}
                          fieldKey={key}
                          value={value}
                          categories={categories}
                          incoming
                          originalValue={fetchedData?.[key]}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/30 flex flex-col gap-3 p-4">
              {!showDenyForm ? (
                <div className="flex gap-3 w-full justify-center">
                  <Button
                    type="submit"
                    name="_action"
                    value="approve"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    Approve Request
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowDenyForm(true)}
                    className="border-red-600 text-red-600 hover:bg-red-50 px-8"
                  >
                    Deny Request
                  </Button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <Select onValueChange={setDenialSelect} value={denialSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a reason for denial" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASONS.map((item, index) => (
                        <SelectItem value={item} key={index}>{item}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {denialSelect === "Other" && (
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 min-h-[80px] resize-y"
                      placeholder="Please provide a reason for denial..."
                      value={customDenialReason}
                      onChange={(e) => setCustomDenialReason(e.target.value)}
                    />
                  )}

                  <div className="flex gap-3 justify-center">
                    <Button
                      type="submit"
                      name="_action"
                      value="deny"
                      className="bg-red-600 hover:bg-red-700 text-white px-8"
                      disabled={!finalDenialReason}
                    >
                      Confirm Denial
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setShowDenyForm(false);
                        setDenialSelect("");
                        setCustomDenialReason("");
                      }}
                      className="px-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Hidden form fields */}
              <input type="hidden" name="org_id" value={selectedRequest.org_id} />
              <input type="hidden" name="request_id" value={selectedRequest.id} />
              <input type="hidden" name="base_id" value={selectedRequest.base_id} />
              <input type="hidden" name="user_id" value={selectedRequest.user_id} />
              <input type="hidden" name="request_type" value={selectedRequest.request_type} />
              {finalDenialReason && <input type="hidden" name="denial_reason" value={finalDenialReason} />}
            </CardFooter>
          </Card>
        </div>
      </Form>
    );
  };

  // SUPERADMIN VIEW
  if (isSuperAdmin) {
    return (
      <div className="p-4 flex-1">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl pl-1 font-bold">All Requests</h2>
          <FilterByType filterBy={filterBy} setFilterBy={setFilterBy} isSuperAdmin />
          {allRequests && allRequests.length > 0 ? (
            <div className="lg:grid grid-cols-3 gap-4 md:flex md:flex-col">
              {allRequests.filter(item => filterBy.includes(item.request_type)).map(request => (
                <RequestCard
                  key={request.id}
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
        <RequestModal />
      </div>
    );
  }

  // BASE ADMIN VIEW
  return (
    <div className="flex-1">
      {baseData ? (
        <Tabs defaultValue="requests">
          <TabsList className="bg-card border mt-4 ml-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
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
            <div className="flex flex-col gap-4 mx-4">
              <FilterByType filterBy={filterBy} setFilterBy={setFilterBy} />
              {orgRequests && orgRequests.length > 0 ? (
                <div className="lg:grid grid-cols-3 gap-4 md:flex md:flex-col">
                  {orgRequests.filter(item => filterBy.includes(item.request_type)).map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      allUsers={allUsers}
                      allOrgs={orgsByBase}
                      setSelectedRequest={setSelectedRequest}
                    />
                  ))}
                </div>
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
      <RequestModal />
    </div>
  );
}