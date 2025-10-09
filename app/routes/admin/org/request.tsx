import { createClient } from "@supabase/supabase-js"
import { Form, Navigate, redirect, useNavigate, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router"
import type { Route } from "../+types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EditableField } from "~/components/EditableField";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { Building, Key } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
      const searchParams = new URL(request.url).searchParams;
      console.log(searchParams)
      const id = searchParams.get("id");
      console.log('id: ', id)

      try{
            const {data: requestData, error: requestError} = await supabase.from("request").select("*").eq("id", id);
            // console.log('orgId data: ', orgId[0].id)
            if(requestData){
                  const { data: orgData, error: orgError } = await supabase.from("organization").select("*").eq("id", requestData[0].org_id)
                  if(orgError){
                        console.log(orgError)
                        // return redirect("..");
                  }
                  // console.log('test action: ', orgId)
                  return {requestData, orgData}
            }
      }catch (e){
            console.error(e)
      }
      // return { data }
}

export const action = async ({ request }: ActionFunctionArgs) => {
      // console.log('test')
      const formData = await request.formData()
      const name = formData.get("name")
      const orgId = formData.get("orgId")
      const requestId = formData.get("requestId")
      console.log('formData', formData)

      try{
            console.log('in try')
            const {data, error} = await supabase.from("organization").update({"name": name}).eq("id", orgId)
            console.log(data, error)
            if(!error){
                  console.log('test')
                  const {data: deleteData, error: deleteError} = await supabase.from("request").delete().eq('id', requestId);
                  console.log('data: ', deleteData, ' error: ', deleteError)
                  if(!deleteError){
                        return redirect("..")
                  }

            }
      }catch(e){
            console.error(e)
      }
}

export default function RequestOrgUpdate({loaderData}: Route.ComponentProps){
      const {requestData, orgData} = loaderData;
      console.log('data: ',orgData)

      const [name, setName] = useState(orgData[0].name);
      const [nameEdit, setNameEdit] = useState(false);
      const navigate = useNavigate();

      return (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <Card className="w-1/4 md:w-3/4 ">
        <CardHeader>
          <p className="text-2xl">{orgData[0].name}</p>
        </CardHeader>
        <CardContent className="">
          <Form method="POST" encType="multipart/form-data">
            <div className="flex w-full">
                  <div className="w-1/2 border-r-1 border-r-black/30 mr-6 flex flex-col space-y-2">
                        <p className="mb-2">Current:</p>
                        <div className="flex flex-col">
                              <p className="font-semibold">Name:</p>
                              <p>{orgData[0].name}</p>
                        </div>
                        <div className="flex flex-col">
                              <p className="font-semibold">Description:</p>
                              <p>{orgData[0].description}</p>
                        </div>
                        <div className="flex flex-col">
                              <p className="font-semibold">DSN:</p>
                              <p>{orgData[0].contact}</p>
                        </div>
                  </div>
                  <div className=" flex flex-col w-1/2">
                        <p>Incoming:</p>
                        {Object.entries(requestData[0].data).map(([key, value]: [string, any]) =>{
                              if(key !== 'submit' && key !== 'userId')
                                    return(
                                    <EditableField label={key.toUpperCase().slice(0,1) + key.slice(1) + ":"} name={key} field={value} setField={setName} Icon={Building} fieldEdit={nameEdit} setFieldEdit={setNameEdit} disabled={false} />)})}
                  </div>
            </div>
            <input type="hidden" name="orgId" value={orgData[0].id} />
            <input type="hidden" name="requestId" value={requestData[0].id} />
            <div className="flex justify-center mt-4 gap-2">
            <Button className="text-center bg-green-500">Approve Changes</Button>
            <Button type="button" className="text-center bg-red-500" onClick={() => navigate("..")}>Deny Changes</Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
      )
}