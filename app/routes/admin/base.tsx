import {
  Form,
  Navigate,
  Outlet,
  redirect,
  useNavigate,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import type { Route } from "../+types/home";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import React, { useState, type HTMLElementType } from "react";
import {
  Building,
  Edit,
  Edit2,
  FileIcon,
  Mail,
  MapPin,
  MapPinIcon,
  Phone,
  Save,
  SaveIcon,
  Shield,
  SpeakerIcon,
  Users,
  X,
} from "lucide-react";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import UploadModal from "~/components/UploadModal";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Checkbox } from "~/components/ui/checkbox";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const baseId = searchParams.get("id");
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return redirect("/");
  }
  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    },
    {} as Record<string, string>
  );
  try {
    const { data } = await supabase
      .from("baseDetails")
      .select(`*, base(*), user(*)`);
    const { count, error } = await supabase
      .from("organization")
      .select("*", { count: "exact", head: true })
      .eq("base_id", baseId);
    return { data, orgCount: count };
  } catch (error) {
    console.error("Error: ", error);
  }
  return {};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const searchParams = new URL(request.url).searchParams
  const baseId = searchParams.get("id")

  const coverImage = formData.get("coverImage") as File;
  const baseName = formData.get("baseName");
  const motto = formData.get("motto");
  const commander = formData.get("commander");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const showName = formData.get("showName");
  const _action = formData.get("submit");
  const toggle = showName === 'on' ? true : false

  let imageUrl = null;

  console.log(formData.get("submit"), toggle)

  switch (_action) {
    case "motto-submit": await supabase.from("baseDetails").update({ "motto": motto }).eq('base_id', baseId);
      break;
    case "commander-submit": await supabase.from("baseDetails").update({ "commander": commander }).eq("base_id", baseId);
      break;
    case "phone-submit": await supabase.from("baseDetails").update({ "phone": phone }).eq("base_id", baseId);
      break;
    case "email-submit": await supabase.from("baseDetails").update({ "email": email }).eq("base_id", baseId);
      break;
    case "showName-submit": await supabase.from("baseDetails").update({ "show_name": toggle }).eq("base_id", baseId);
      break;
    case "coverImage-submit": if(coverImage && coverImage.size > 0){
      console.log('here')
      const fileExt = coverImage.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const {data: uploadData, error: uploadError} = await supabase.storage.from('images')
      .upload(fileName, coverImage, {
        cacheControl: '3600', upsert: false
      });
      if(uploadError){
        return {success: false, error: uploadError.message};
      }
      const {data: urlData} = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
      console.log(imageUrl)

      const { error: updateError } = await supabase.from("baseDetails").update({"image_url": imageUrl}).eq('base_id', baseId);
      if(updateError){
        return {success: false, error: updateError.message};
      }
    }
    break;
    
  }
}

const EditableField = ({
  label,
  name,
  field,
  setField,
  Icon,
  fieldEdit,
  setFieldEdit,
  type,
}: {
  label: string;
  name: string;
  field: string;
  setField: any;
  Icon: any;
  fieldEdit: boolean;
  setFieldEdit: any;
  type?: string;
}) => {
  return (
    <div>
      <Form method="POST">
        <div className="flex justify-between">
          <div className="flex gap-2 mb-2">
            <Icon className="h-4 w-4" />
            <Label>{label}</Label>
          </div>
          <div>
            {fieldEdit && (
              <div className="flex gap-2">
                <button type="submit" value={`${name}-submit`} name="submit"><Save className="w-4 h-4 hover:bg-gray-200 hover:rounded" /></button>
                <X
                  onClick={() => setFieldEdit(false)}
                  className="w-4 h-4 hover:bg-gray-200 hover:rounded"
                />
              </div>
            )}
            {!fieldEdit && (
              <Edit2
                onClick={() => setFieldEdit(true)}
                className="w-4 h-4 hover:bg-gray-200 hover:rounded"
              />
            )}
          </div>
        </div>
        {!fieldEdit && (
          <p className="bg-gray-50 p-2 rounded text-sm font-medium">{field}</p>
        )}
        {fieldEdit && !type && (
          <input
            type="text"
            name={name}
            className="w-full p-2 font-medium text-sm border rounded-lg"
            value={field}
            onChange={(e) => setField(e.currentTarget.value)}
          />
        )}
        {fieldEdit && type === "textarea" && (
          <textarea
            name={name}
            className="w-full p-2 font-medium text-sm border rounded-lg"
            value={field}
            onChange={(e) => setField(e.currentTarget.value)}
          />
        )}
      </Form>
    </div>
  );
};

export default function BaseAdmin({ loaderData }: Route.ComponentProps) {
  const { data, orgCount } = loaderData;
  const selectedBase = data[0];
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState(selectedBase.base.name);
  const [nameEdit, setNameEdit] = useState(false);
  const [motto, setMotto] = useState(selectedBase.motto);
  const [mottoEdit, setMottoEdit] = useState(false);
  const [phone, setPhone] = useState(selectedBase.phone);
  const [phoneEdit, setPhoneEdit] = useState(false);
  const [email, setEmail] = useState(selectedBase.email);
  const [emailEdit, setEmailEdit] = useState(false);
  const [coverImage, setCoverImage] = useState(selectedBase.image_url);
  const [commander, setCommander] = useState(selectedBase.commander);
  const [commanderEdit, setCommanderEdit] = useState(false);
  const [showName, setShowName] = useState(selectedBase.show_name);

  return (
    <div className="w-full flex-1 overflow-auto p-4 bg-linear-to-br from-blue-400 to-teal-300">
      <div className="grid gap-4">
        {/* Base Header Card */}
        <Card>
          <CardContent className="">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  
                  <div className="relative group">
                    <img
                      src={selectedBase.image_url ?? "http://cataas.com/cat"}
                      alt={`${selectedBase.name} cover`}
                      className="w-full h-50 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowModal(true)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-balance">
                    {selectedBase.base.name}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {selectedBase.base.city}, {selectedBase.base.state}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-[auto_auto_auto]">
                  <div className="flex items-center gap-2 text-sm text-center">
                    <Card className="shadow-md">
                      <CardContent className="flex flex-col justify-center text-center space-y-1">
                        <div className="flex gap-2 items-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Personnel</p>
                        </div>
                        <span className="font-medium text-xl">
                          {selectedBase.population || 0}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-center">
                    <Card className="shadow-md">
                      <CardContent className="flex flex-col justify-center text-center space-y-1">
                        <div className="flex gap-2 items-center">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Organizations</p>
                        </div>
                        <span className="font-medium text-xl">{orgCount}</span>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex items-center text-center gap-2 text-sm">
                    <Card className="shadow-md">
                      <CardContent className="flex flex-col justify-center text-center gap-1">
                        <div className="flex gap-2 items-center">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Status</p>
                        </div>
                        <span className="text-green-600 text-xl">Active</span>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Base Information Cards */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <Tabs defaultValue="baseDetails">
                <TabsList>
                  <TabsTrigger value={"baseDetails"}>Base Details</TabsTrigger>
                  <TabsTrigger value={"appView"}>App View</TabsTrigger>
                </TabsList>
                <TabsContent value={"baseDetails"} className="mt-4">
                  {/* <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6"> */}
                      <EditableField
                        label={"Base Name"}
                        name="baseName"
                        field={name}
                        setField={setName}
                        Icon={Building}
                        fieldEdit={nameEdit}
                        setFieldEdit={setNameEdit}
                      />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <div className="p-2 rounded-md bg-muted/50 text-sm">
                          {selectedBase.base.city}, {selectedBase.base.state}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Location cannot be modified
                        </p>
                      </div>

                      <EditableField
                        field={motto}
                        name="motto"
                        label="Base Motto"
                        setField={setMotto}
                        Icon={Building}
                        fieldEdit={mottoEdit}
                        setFieldEdit={setMottoEdit}
                        type="textarea"
                      />
                    {/* </CardContent>
                  </Card> */}
                </TabsContent>
                <TabsContent value="appView">
                  <Form method="POST">
                    <div className="flex flex-cols-[auto_1fr] gap-4">
                      <div className="relative flex flex-col justify-center">

                      <div className="flex items-center gap-4 pb-4">
                        <Checkbox name="showName" checked={showName} onCheckedChange={() => setShowName(!showName)} />
                        <label className="text-sm">Show Base name on image card? </label>
                      </div>
                    <Button type="submit" name="submit" value="showName-submit" variant={"outline"} className="w-full absolute bottom-0"><SaveIcon size={18}/>Save</Button>
                      </div>
                      <div className="relative w-[400px] h-[200px] mx-auto rounded-xl bg-gray-200">
                        <img src={selectedBase.image_url} className="w-full h-[200px] object-cover rounded-xl"/>
                        {showName && <div className="bg-black/40 rounded-xl absolute inset-0 items-center flex flex-col justify-center text-white">
                          <p className="text-center text-xl font-bold">{selectedBase.base.name}</p>
                          <p>{selectedBase.base.city + ", " + selectedBase.base.state}</p>
                        </div>}
                      </div>
                    </div>

                    {/* <input type="checkbox" name="showName" checked={showName} onChange={() => setShowName(!showName)}/> */}
                  </Form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="appView">App View</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <EditableField label="Motto" name="motto" field={motto} setField={setMotto} Icon={SpeakerIcon} fieldEdit={mottoEdit} setFieldEdit={setMottoEdit} />
                </TabsContent>
                <TabsContent value="appView">
                  <div className="flex flex-cols-[auto_1fr]">

                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
          
          {/* Command & Personnel */}
          <Card>
            <CardHeader>
              <Tabs defaultValue="command">
                <TabsList>
                  <TabsTrigger value="command">Command</TabsTrigger>
                  <TabsTrigger value="appView">App View</TabsTrigger>
                </TabsList>
                <TabsContent value="command" className="mt-4">
                  <EditableField
                                  field={commander}
                                  name="commander"
                                  setField={setCommander}
                                  label="Base Commander"
                                  fieldEdit={commanderEdit}
                                  setFieldEdit={setCommanderEdit}
                                  Icon={Shield}
                                />
                </TabsContent>
                <TabsContent value="appView">

                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Contact Information */}
          <Card className="">
            <CardHeader>
              <Tabs defaultValue="contact">
                <TabsList>
                  <TabsTrigger value="contact">Contact Information</TabsTrigger>
                  <TabsTrigger value="appView">App View</TabsTrigger>
                </TabsList>
                <TabsContent value="contact" className="mt-4">
                  <div className="space-y-6">
                  <EditableField
                    field={phone}
                    setField={setPhone}
                    fieldEdit={phoneEdit}
                    setFieldEdit={setPhoneEdit}
                    name="phone"
                    label="Phone Number"
                    Icon={Phone}
                  />

                  <EditableField
                    field={email}
                    setField={setEmail}
                    fieldEdit={emailEdit}
                    setFieldEdit={setEmailEdit}
                    name="email"
                    label="Email Address"
                    Icon={Mail}
                  />
                </div>
                </TabsContent>
                <TabsContent value="appView">

                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
      {showModal && (
        <UploadModal
          isOpen={showModal}
          onClose={setShowModal}
          setCoverImage={setCoverImage}
        ></UploadModal>
      )}
    </div>
  );
}
