import { createClient } from "@supabase/supabase-js"
import { Form, Navigate, redirect, useNavigate, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router"
import type { Route } from "../+types/admin";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { EditableField } from "~/components/EditableField";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { Building, CircleXIcon, Key, Shield, Globe, Mail, FileText, User, Palette, Phone, ImageIcon } from "lucide-react";
import { categories } from "~/lib/constants";
import { Badge } from "~/components/ui/badge";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Field configuration mapping
const fieldConfig: Record<string, { label: string; Icon: any }> = {
  name: { label: "Name", Icon: Building },
  description: { label: "Description", Icon: FileText },
  type: { label: "Category", Icon: Shield },
  contact: { label: "DSN", Icon: Phone },
  web_url: { label: "Web URL", Icon: Globe },
  image_url: { label: "Logo", Icon: User}
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  // console.log(searchParams)
  const id = searchParams.get("id");
  // console.log('id: ', id)

  try{
    const {data: requestData, error: requestError} = await supabase.from("request").select("*").eq("id", id);
    // console.log('rd', requestData)
    if(requestData && requestData.length > 0){
      const { data: orgData, error: orgError } = await supabase.from("organization").select("*").eq("id", requestData[0].org_id)
      if(orgError){
        console.log('error', orgError)
      }
      return {requestData, orgData}
    }
    return{}
  }catch (e){
    console.error(e)
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const orgId = formData.get("orgId")
  const requestId = formData.get("requestId")
  const _action = formData.get("submit")
  // console.log('fD: ', formData)
  
  // Build update object from all form fields except system fields
  if(_action === "change-submit"){

    const updateData: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (!['orgId', 'requestId', 'submit'].includes(key)) {
        updateData[key] = value
      }
    }
    // console.log('uD', updateData)
    try {
      const {data, error} = await supabase
      .from("organization")
      .update(updateData)
      .eq("id", orgId)
      
      if(!error){
        const {data: deleteData, error: deleteError} = await supabase
        .from("request")
        .delete()
        .eq('id', requestId)
        
        if(!deleteError){
          return redirect("..")
        }
      }
      console.log(error)
    } catch(e) {
      console.error(e)
    }
  }
  if(_action === "deny-submit"){
    // console.log('test')
    const requestId = formData.get("requestId");
    const reason = formData.get("denial-reason");
    const image = formData.get('image_url') as string

    try{
      const {data, error} = await supabase
      .from("request")
      .update({"is_denied": true, "denial_reason": reason})
      .eq("id", requestId)

      if(error){
        console.log(error)
        return redirect("..")
      }

      if(image){
        const { data: imgData, error: imgError } = await supabase
        .storage
        .from("images")
        .remove([image])

        if(imgError){
          // console.log(imgError)
        }
        if(imgData){
          return redirect("..")
        }
      }
      
    } catch (e){
      console.error(e)
    }

  }
}

export default function RequestOrgUpdate({loaderData}: Route.ComponentProps){
  const {requestData, orgData} = loaderData;
  const [selectedBadge, setSelectedBadge] = useState(requestData[0].data.type)
  const navigate = useNavigate();
  const [showDenialBox, setShowDenialBox] = useState(false);
  // console.log(requestData)

  // Filter out system fields and get only the changed fields
  const changedFields = Object.entries(requestData[0].data).filter(
    ([key]) => !['submit', 'userId', 'orgId'].includes(key)
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <Card className="w-1/4 md:w-3/4">
        <CardHeader>
          <div className="flex justify-between">
            <p className="text-2xl">{orgData[0].name}</p>
            <button 
              className="rounded-full h-fit text-black/50 hover:cursor-pointer" 
              onClick={() => navigate("..")}
            >
              <CircleXIcon size={20}/>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Form method="POST" encType="multipart/form-data">
            <div className="flex flex-col space-y-6">
              {/* Header Row */}
              {/* <div className="flex w-full text-sm font-semibold pb-2">
                <div className="w-1/2 pr-4">Current</div>
                <div className="w-1/2 pl-4">Incoming</div>
              </div> */}

              {/* Changed Fields */}
              {changedFields.map(([key, incomingValue]: [string, any]) => {
                const currentValue = orgData[0][key];
                const config = fieldConfig[key] || { label: key, Icon: Building };
                const FieldIcon = config.Icon;

                // Special handling for type (category) field
                if( key === 'image'){
                  return (
                    <div key={key} className="flex w-full text-sm">
                      {/* Current Column */}
                      <div className="flex flex-col w-1/2">
                        <p className="pb-4">Current</p> 
                        <div className="w-1/2 pr-4">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <ImageIcon size={16}/>
                            Logo
                          </div>
                          {orgData.image_url ? <img width={200} height={200} src={orgData.image_url}/> : <div className="w-[200px] h-[200px] border-2 border-dashed border-gray-300 rounded-lg text-center items-center justify-center flex text-2xl ">No Image</div>}
                        </div>
                      </div>

                      {/* Vertical Separator */}
                      <div className="w-px bg-black/30"></div>

                      {/* Incoming Column */}
                      <div className="w-1/2 pl-4">
                        <div className="flex flex-col">
                          <p className="pb-4">Incoming</p>
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <ImageIcon size={16}/>
                            Logo
                          </div>
                          <div className="space-x-2 space-y-2">
                            <img width={200} height={200} src={`https://mbipidprgvippwpmljas.supabase.co/storage/v1/object/public/images/${requestData[0].data.image}`}/>
                            <input type="hidden" name="image_url" value={`https://mbipidprgvippwpmljas.supabase.co/storage/v1/object/public/images/${requestData[0].data.image}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (key === 'type') {
                  return (
                    <div key={key} className="flex w-full text-sm">
                      {/* Current Column */}
                      <div className="flex flex-col w-1/2">
                        <p className="pb-4">Current</p> 
                        <div className="w-1/2 pr-4">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <FieldIcon size={16}/>
                            {config.label}
                          </div>
                          <Badge
                            variant="outline"
                            className="py-2 px-3 shadow-md border"
                          >
                            {currentValue}
                          </Badge>
                        </div>
                      </div>

                      {/* Vertical Separator */}
                      <div className="w-px bg-black/30"></div>

                      {/* Incoming Column */}
                      <div className="w-1/2 pl-4">
                        <div className="flex flex-col">
                          <p className="pb-4">Incoming</p>
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <FieldIcon size={16}/>
                            {config.label}
                          </div>
                          <div className="space-x-2 space-y-2">
                            {categories.map((item, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                onClick={() => setSelectedBadge(item.type)}
                                className={`py-2 px-3 shadow-md border cursor-pointer ${
                                  selectedBadge === item.type ? item.color : ""
                                } hover:-translate-y-1 hover:shadow-lg transition-all`}
                              >
                                {item.type}
                              </Badge>
                            ))}
                            <input type="hidden" name="type" value={selectedBadge} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Standard field rendering
                return (
                  <div key={key} className="flex w-full text-sm">
                    {/* Current Column */}
                    <div className="w-1/2 pr-4">
                      <p className="pb-4">Current</p> 
                      <div className="flex items-center gap-2 font-medium mb-2">
                        <FieldIcon size={16}/>
                        {config.label}
                      </div>
                      <p className="bg-gray-50 p-2 rounded-md">{currentValue || 'N/A'}</p>
                    </div>

                    {/* Vertical Separator */}
                    <div className="w-px bg-gray-300"></div>

                    {/* Incoming Column */}
                    <div className="w-1/2 pl-4">
                      <p className="pb-4">Incoming</p> 
                      <div className="flex items-center gap-2 font-medium mb-2">
                        <FieldIcon size={16}/>
                        {config.label}
                      </div>
                      {key === "description" ? 
                        <textarea 
                          name={key}
                          defaultValue={incomingValue}
                          className="w-full bg-green-50 border border-green-200 p-2 rounded-md"
                        />
                        : <input
                          type="text"
                          name={key}
                          defaultValue={incomingValue}
                          className="w-full bg-green-50 border border-green-200 p-2 rounded-md"
                        />
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            <input type="hidden" name="orgId" value={orgData[0].id} />
            <input type="hidden" name="requestId" value={requestData[0].id} />
            
            <div className="flex justify-center mt-6 gap-2">
              <Button className="text-center bg-green-500" name="submit" type="submit" value="change-submit">Approve Changes</Button>
              <Button type="button" className="text-center bg-red-500" onClick={() => setShowDenialBox(!showDenialBox)}>Deny Changes</Button>
            </div>
          </Form>
        </CardContent>
        <CardFooter className="justify-center flex flex-col space-y-4">
        <Form method="POST" className="w-full" >

          {showDenialBox && <><div className=" w-full">
          <p className="pb-2">Reason for denial: </p>
          <textarea 
            className="border w-full rounded-md"
            name="denial-reason"
            />
          </div>
          <input type="hidden" name="requestId" value={requestData[0].id} />
          {requestData[0].data.image && <input type="hidden" name="image_url" value={requestData[0].data.image}/>}
          <Button className="bg-blue-500" name="submit" type="submit" value="deny-submit">Submit</Button></>}
        </Form>
        </CardFooter>
      </Card>
    </div>
  );
}