import { createClient } from "@supabase/supabase-js"
import { Form, Navigate, redirect, useNavigate, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router"
import type { Route } from "../+types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EditableField } from "~/components/EditableField";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { Building, CircleXIcon, Key, Shield, Globe, Mail, FileText, User, Palette } from "lucide-react";
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
  contact: { label: "DSN", Icon: Mail },
  web_url: { label: "Web URL", Icon: Globe },
  image_url: { label: "Logo", Icon: User},
  primary_color: { label: "Theme", Icon: Palette}
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  console.log(searchParams)
  const id = searchParams.get("id");
  console.log('id: ', id)

  try{
    const {data: requestData, error: requestError} = await supabase.from("request").select("*").eq("id", id);
    if(requestData){
      const { data: orgData, error: orgError } = await supabase.from("organization").select("*").eq("id", requestData[0].org_id)
      if(orgError){
        console.log(orgError)
      }
      return {requestData, orgData}
    }
  }catch (e){
    console.error(e)
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const orgId = formData.get("orgId")
  const requestId = formData.get("requestId")
  
  // Build update object from all form fields except system fields
  const updateData: Record<string, any> = {}
  for (const [key, value] of formData.entries()) {
    if (!['orgId', 'requestId'].includes(key)) {
      updateData[key] = value
    }
  }
  console.log('uD', updateData)
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
  } catch(e) {
    console.error(e)
  }
}

export default function RequestOrgUpdate({loaderData}: Route.ComponentProps){
  const {requestData, orgData} = loaderData;
  const [selectedBadge, setSelectedBadge] = useState(requestData[0].data.type)
  const navigate = useNavigate();

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
            <div className="flex flex-col space-y-4">
              {/* Header Row */}
              <div className="flex w-full text-sm font-semibold pb-2 border-b">
                <div className="w-1/3">Field</div>
                <div className="w-1/3">Current</div>
                <div className="w-1/3">Incoming</div>
              </div>

              {/* Changed Fields */}
              {changedFields.map(([key, incomingValue]: [string, any]) => {
                const currentValue = orgData[0][key];
                const config = fieldConfig[key] || { label: key, Icon: Building };
                const FieldIcon = config.Icon;

                // Special handling for type (category) field
                if (key === 'type') {
                  return (
                    <div key={key} className="flex w-full items-start text-sm">
                      <div className="w-1/3 flex items-center gap-2 font-medium">
                        <FieldIcon size={16}/>
                        {config.label}
                      </div>
                      <div className="w-1/3">
                        <Badge
                          variant="outline"
                          className="py-2 px-3 shadow-md border"
                        >
                          {currentValue}
                        </Badge>
                      </div>
                      <div className="w-1/3 space-x-2 space-y-2">
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
                  );
                }

                // Standard field rendering
                return (
                  <div key={key} className="flex w-full items-start text-sm">
                    <div className="w-1/3 flex items-center gap-2 font-medium">
                      <FieldIcon size={16}/>
                      {config.label}
                    </div>
                    <div className="w-1/3">
                      <p className="bg-gray-50 p-2 rounded-md">{currentValue || 'N/A'}</p>
                    </div>
                    <div className="w-1/3">
                      {key === "description" ? 
                        <textarea 
                        name={key}
                        defaultValue={incomingValue}
                        className="w-full bg-green-50 border border-green-200 p-2 rounded-md"
                        />
                        :<input
                        type="text"
                        name={key}
                        defaultValue={incomingValue}
                        className="w-full bg-green-50 border border-green-200 p-2 rounded-md"
                      />}
                    </div>
                  </div>
                );
              })}
            </div>

            <input type="hidden" name="orgId" value={orgData[0].id} />
            <input type="hidden" name="requestId" value={requestData[0].id} />
            
            <div className="flex justify-center mt-6 gap-2">
              <Button className="text-center bg-green-500">Approve Changes</Button>
              <Button type="button" className="text-center bg-red-500">Deny Changes</Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}