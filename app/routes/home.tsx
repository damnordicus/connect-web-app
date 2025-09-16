import type { Route } from "./+types/home";
import { Card, CardContent } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Form, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import {  useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Cookies from "js-cookie";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie');
  if(!cookieHeader){
    return redirect('/login');
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
    console.log(data[0])
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

    if(_action === "submit"){
      try{
        const { error } = await supabase.from("organization").update({name: name, description: description, contact: poc, type: badge}).eq('id', id);
      }catch(error){
        console.error(error);
      }
    }
    console.log(formData)
}

export default function Home({ loaderData}: Route.ComponentProps) {

  const {orgData} = loaderData;
  const [selectedBadges, setSelectedBadges] = useState<string>(orgData?.type);
  const [description, setDescription] = useState(orgData?.description);
  const [name, setName] = useState(orgData?.name);
  const [poc, setPOC] = useState(orgData?.contact);

  const categories = [
    {
      type: "WING",
      color: `${selectedBadges === "WING" ? 'border-[#fa6257] bg-[#fa6257]/15 text-[#fa6257] hover:shadow-[#fa6257]/35': ''} `,
    },
    {
      type: "GROUP",
      color: `${selectedBadges === "GROUP" ? 'border-[#fab657] bg-[#fab657]/15 text-[#fab657] hover:shadow-[#fab657]/35' : ''}`,
    },
    {
      type: "SQUADRON",
      color: `${selectedBadges === "SQUADRON" ? 'border-[#57fa5a] bg-[#57fa5a]/15 text-[#57fa5a] hover:shadow-[#57fa5a]/35' :''}`,
    },
    {
      type: "AGENCY",
      color: `${selectedBadges === "AGENCY" ? 'border-[#579efa] bg-[#579efa]/15 text-[#579efa] hover:shadow-[#579efa]/35': ''}`,
    },
    {
      type: "SUPPORT",
      color: `${selectedBadges === "SUPPORT" ? 'border-[#e257fa] bg-[#e257fa]/15 text-[#e257fa] hover:shadow-[#e257fa]/35':''}`,
    },
  ];

  useEffect(() => {
    if (orgData?.type){
      setSelectedBadges(orgData.type);
    }
  },[orgData?.type])

  useEffect(() => {
    if (orgData?.name){
      setName(orgData.name);
    }
  },[orgData?.name])

  useEffect(() => {
    if (orgData?.description){
      setDescription(orgData.description);
    }
  },[orgData?.description])

  useEffect(() => {
    if (orgData?.contact){
      setPOC(orgData.contact);
    }
  },[orgData?.contact])

  if(orgData){
    return (
    <div className="flex flex-col items-center mt-8">
      <Card className="w-1/2">
        <CardContent className="text-center">
          <Form method="POST">
          <input type="hidden" name="id" value={orgData.id}/>
          <h1 className="text-xl">Organization Details</h1>
          <InputWithLabel label="Name" name="name" type="text" setter={setName} value={name}/>
          <div className="text-left w-full space-y-2">
            <p>Category: </p>
            <div className="space-x-2">
              {categories.map((item, index) => <Badge key={index} variant={"outline"} 
              onClick={() => {
                if(selectedBadges === item.type)
                  setSelectedBadges("")
                else
                  setSelectedBadges(item.type)
              }}
              className={`py-2 px-3 shadow-md border ${item.color} hover:-translate-y-1 hover:shadow-lg`}>{item.type}</Badge>)}
            </div>
          </div>
          <InputWithLabel label="Description" name="description" type="textarea" setter={setDescription} value={description}/>
          {/* <InputWithLabel label="Slogan" name="slogan" type="text" setter={() => {}} value="Something corny"/> */}
          <InputWithLabel label="Point Of Contact" name="poc" type="text" setter={setPOC} value={poc} /> 
          {/* <InputWithLabel label="City" name="city" type="text" value={orgData.base_id.city}/>
          <div className="text-left w-full space-y-2">
            <p>State: </p>
            <select className="w-full border rounded-md py-1" name="state" defaultValue={orgData.base_id.state}>
              {states.map(state => <option value={state}>{state}</option>)}
            </select>
          </div> */}
          <input type="hidden" name="badge" value={selectedBadges} />
          <Button className="mt-4 w-full bg-blue-400" type="submit" name="_action" value="submit">Update</Button>
          </Form>
        </CardContent>
      </Card>
    </div>
    );
  }else{
    return (
      <div>Loading...</div>
    )
  }
  
}
