import type { Route } from "./+types/home";
import { Card, CardContent } from "~/components/ui/card";
import InputWithLabel from "~/components/ui/input-with-label";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Form, redirect, useRouteLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import {  useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import FileInput, { type FileInputProps } from "~/components/FileUpload";
import { OrgCard } from "~/components/OrgCard";

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
    const image = formData.get("logo") as File;
    const primary = formData.get("primary");
    const secondary = formData.get("secondary");
    const text = formData.get("text");

    if(_action === "submit"){
      try{
        const { error } = await supabase.from("organization").update({name: name, description: description, contact: poc, type: badge, primary_color: primary, secondary_color: secondary, text_color: text}).eq('id', id);
        let imageUrl = null;
        if(image && image.size > 0 ){
          console.log('test: ', image)
          const fileExt = image.name.split('.').pop();
          const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const {data: uploadData,error: uploadError} = await supabase.storage
            .from('images')
            .upload(filename, image, {
              cacheControl: '3600',
              upsert: false
            });

          console.log("ud: ", uploadData)
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
    console.log(formData)
}

export default function Home({ loaderData}: Route.ComponentProps) {

  const {orgData} = loaderData;
  const [selectedBadges, setSelectedBadges] = useState<string>(orgData?.type);
  const [description, setDescription] = useState(orgData?.description);
  const [name, setName] = useState(orgData?.name);
  const [poc, setPOC] = useState(orgData?.contact);
  const {orgs} = useRouteLoaderData('header') ;
  const [primaryColor, setPrimaryColor] = useState(orgData?.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(orgData?.secondary_color);
  const [textColor, setTextColor] = useState("");
  // console.log()

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
    if(orgData?.name){
      setName(orgData.name);
    }
    if(orgData?.description){
      setDescription(orgData.description);
    }
    if(orgData?.contact){
      setPOC(orgData.contact);
    }
    if(orgData?.type){
      setSelectedBadges(orgData.type);
    }
    if(orgData?.primary_color){
      setPrimaryColor(orgData.primary_color)
    }

  },[orgData])

  if(orgData){
    return (
    <div className="flex flex-col h-screen items-center p-8 bg-linear-to-br from-blue-400 to-teal-300">
      <Card className="lg:w-1/2 md:w-full">
        <CardContent className="text-center">
          <Form method="POST" encType="multipart/form-data">
          <input type="hidden" name="id" value={orgData.id}/>
          {orgData.image_url &&
           <div className="w-full flex justify-center">
            <div className="w-32 h-32 place-self-center mb-4 border-2 border-zinc-300/60 rounded-xl shadow-lg">
              <img src={orgData.image_url} style={{width: "90%" , height: "90%", margin:'auto', borderRadius: 12}}/>
            </div>
          </div>}
          <h1 className="text-2xl">Organization Details</h1>
          <div>
            {/* <p className="text-left w-full space-y-2">Logo:</p> */}
            <FileInput label={"Logo"} name={"logo"} />
          </div>
          <InputWithLabel label="Name" name="name" type="text" setter={setName} value={name}/>
          <div className="text-left w-full space-y-2">
            <p>Category: </p>
            <div className="space-x-2 space-y-2">
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
          {/* <div className="w-full space-y-2 text-left">
            <p>Background Color: </p>
            <input type="color" name="primary" value={primaryColor} onChange={(e) => setPrimaryColor(e.currentTarget.value)} className=""/>
          </div>
          <div className="w-full space-y-2 text-left">
            <p>Border Color: </p>
            <input type="color" name="secondary" value={secondaryColor} onChange={(e) => setSecondaryColor(e.currentTarget.value)} className=""/>
          </div>
          <div className="w-full space-y-2 text-left">
            <p>Text Color: </p>
            <input type="color" name="text" value={textColor} onChange={(e) => setTextColor(e.currentTarget.value)} className=""/>
          </div> */}
          <div className="flex flex-col">
            <p>Card Color: </p>
            <div className="flex justify-between">
              <p onClick={() => {setPrimaryColor("#93c5fd"); setSecondaryColor("#60a5fa")}} className="p-4 bg-blue-300 rounded-full border-2 border-blue-400"></p>
              <p onClick={() => {setPrimaryColor("#d8b4fe"); setSecondaryColor("#c084fc")}} className="p-4 bg-purple-300 rounded-full border-2 border-purple-400"></p>
              <p onClick={() => {setPrimaryColor("#fca5a5"); setSecondaryColor("#f87171")}} className="p-4 bg-red-300 rounded-full border-2 border-red-400"></p>
              <p onClick={() => {setPrimaryColor("#86efac"); setSecondaryColor("#4ade80")}} className="p-4 bg-green-300 rounded-full border-2 border-green-400"></p>
              <p onClick={() => {setPrimaryColor("#fdba74"); setSecondaryColor("#fb923c")}} className="p-4 bg-orange-300 rounded-full border-2 border-orange-400"></p>
              <p onClick={() => {setPrimaryColor("#fde047"); setSecondaryColor("#facc15")}} className="p-4 bg-yellow-300 rounded-full border-2 border-yellow-400"></p>
              <p onClick={() => {setPrimaryColor("#ffffff"); setSecondaryColor("#f3f4f6")}} className="p-4 bg-white rounded-full border-2 border-gray-100"></p>
            </div>
            <input type="hidden" value={primaryColor} name="primary" />
            <input type="hidden" value={secondaryColor} name="secondary" />
          </div>
          <input type="hidden" name="badge" value={selectedBadges} />
          <p className="text-left  mt-2">Preview: </p>
          <OrgCard primaryColor={primaryColor} secondaryColor={secondaryColor} textColor={textColor} orgData={orgData}/>
          <Button className="mt-4 w-full bg-blue-400" type="submit" name="_action" value="submit">Update</Button>
          </Form>
        </CardContent>
      </Card>
    </div>
    );
  }else{
    return (
      <div className="bg-linear-to-br from-blue-400 to-teal-300 p-6 h-screen">
        <Card className=" shadow-lg">
          <CardContent className="">
            <h1>You are the editor of {orgs.length} organization(s)</h1>
          </CardContent>
        </Card>
      </div>
    )
  }
  
}
