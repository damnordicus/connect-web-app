import {
  Form,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import type { Route } from "../+types/home";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import React, { useEffect, useState, type HTMLElementType } from "react";
import {
  Building,
  Edit,
  Edit2,
  FileIcon,
  Mail,
  MapPin,
  MapPinIcon,
  Phone,
  PhoneIcon,
  PlusIcon,
  QuoteIcon,
  Save,
  SaveIcon,
  Shield,
  SpeakerIcon,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import UploadModal from "~/components/UploadModal";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Checkbox } from "~/components/ui/checkbox";
import { EditableField } from "~/components/EditableField";
import FieldTypes from "~/components/FieldTypes";
import TableField, { type TableData } from "~/components/TableField";
import TileConfiguration, { type TileData} from "~/components/TileConfiguration";
import AppPreview from "~/components/AppPreview";

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
      .select(`*, base(*), user(*)`).eq('base_id', baseId);
    const { count, error } = await supabase
      .from("organization")
      .select("*", { count: "exact", head: true })
      .eq("base_id", baseId);
    const { data: appFieldData } = await supabase.from("appFields").select("*").eq("base_id", baseId).single()
    console.log(appFieldData)
    return { data, orgCount: count, appFieldData };
  } catch (error) {
    console.error("Error: ", error);
  }
  return {};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const searchParams = new URL(request.url).searchParams
  // const baseId = searchParams.get("id")
  const baseId = formData.get("baseId");
  const userId = formData.get("userId");
  const id = searchParams.get('id')

  const request_type = formData.get("request-type");

  const option = formData.get("option")
  console.log(formData)

  if(option === "1"){
    const {data, error} = await supabase.from("appFields").update({"show_tables": true}).eq("base_id", id)
    return {optionData: data}
  }

  let imageUrl = null;
  formData.delete("_action");

  await supabase.from("request").insert({"created_at": new Date(Date.now()), "base_id": baseId, "data": Object.fromEntries(formData.entries()), "user_id": userId, "request_type": "base-update"})


}

export default function BaseAdmin({ loaderData, actionData }: Route.ComponentProps) {
  const { data , orgCount, appFieldData } = loaderData;
  const selectedBase = data[0];
  console.log(appFieldData)
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
  const [showMotto, setShowMotto] = useState(appFieldData.show_motto);
  const [showCommand, setShowCommand] = useState(appFieldData.show_commander);
  const [showContactPhone, setShowContactPhone] = useState(appFieldData.show_phone);
  const [showContactEmail, setShowContactEmail] = useState(appFieldData.show_email);
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [selectedType, setSelectedType] = useState(-1)
  const [tables, setTables] = useState(appFieldData.table_data)
  const [showTable, setShowTable] = useState(false);
  const [editedTables, setEditedTables] = useState<TableData[]>([])
  const [deleteTables, setDeleteTables] = useState<TableData[]>([])

 const [tiles, setTiles] = useState<TileData[]>(appFieldData?.tiles_config || [
  {
    id: "1",
    title: "Base Info",
    type: "text",
    color: "bg-sky-600/20",
    visible: true,
    content: selectedBase.description || "",
  },
  {
    id: "2",
    title: "Contact",
    type: "links",
    color: "bg-rose-600/20",
    visible: true,
    content: [
      { label: "Phone", url: `tel:${selectedBase.phone}` },
      { label: "Email", url: `mailto:${selectedBase.email}` },
    ],
  },
]);

  useEffect(() => {
    console.log(actionData)
    if(actionData && (actionData.optionData === null)){
      setShowFieldModal(false);
    }
  },[actionData])

  if(!selectedBase){
    return(
      <div>
        Loading...
      </div>
    )
  }
  return (
    <div className="w-full px-4 pt-2 pb-6">
      <Form method="POST">

      <div className="grid gap-4">
        {/* Base Header Card */}
        <Card className="rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
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

              <div className="md:col-span-2 flex flex-col space-y-4">
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

                <div className="grid gap-4 sm:grid-cols-[auto_auto_auto] flex-1">
                  <div className="flex items-center gap-2 text-sm text-center">
                    <Card className="bg-card w-full h-full border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                      <CardHeader>
                        <div className="flex gap-2 items-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Personnel</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-center text-center space-y-1 h-full">
                        <span className="font-medium text-xl">
                          {selectedBase.population || 0}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex gap-2 text-sm text-center">
                    <Card className="bg-card w-full h-full border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                      <CardHeader>
                        <div className="flex gap-2 items-center">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Organizations</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-center text-center space-y-1 h-full">
                        <span className="font-medium text-xl">{orgCount}</span>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex items-center text-center gap-2 text-sm">
                    <Card className="bg-card w-full h-full border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                      <CardHeader>
                         <div className="flex gap-2 items-center">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Status</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-center text-center gap-1 h-full">
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
          <Card className="rounded-sm col-span-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <Tabs defaultValue="baseDetails">
                <TabsList className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                  <TabsTrigger className="data-[state=active]:!bg-primary" value={"baseDetails"}>Base Details</TabsTrigger>
                  <TabsTrigger className="data-[state=active]:!bg-primary" value={"appView"}>App View</TabsTrigger>
                </TabsList>
                <TabsContent value={"baseDetails"} className="mt-4">
                  <EditableField
                    label={"Base Name"}
                    name="baseName"
                    field={name}
                    setField={setName}
                    Icon={Building}
                    fieldEdit={nameEdit}
                    setFieldEdit={setNameEdit} 
                    disabled={true} 
                    originalValue={selectedBase.base.name}                      />

                      <div className="space-y-2 mt-2 mb-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <div className="p-2 rounded-md bg-muted/50 text-sm border">
                          {selectedBase.base.city}, {selectedBase.base.state}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Location cannot be modified
                        </p>
                      </div>

                  <EditableField 
                    label="Motto" 
                    name="motto" 
                    field={motto} 
                    setField={setMotto} 
                    Icon={SpeakerIcon} 
                    fieldEdit={mottoEdit} 
                    setFieldEdit={setMottoEdit} 
                    disabled={false} 
                    originalValue={selectedBase.motto} />
                  <EditableField
                    field={commander}
                    name="commander"
                    setField={setCommander}
                    label="Base Commander"
                    fieldEdit={commanderEdit}
                    setFieldEdit={setCommanderEdit}
                    Icon={Shield} 
                    disabled={false} 
                    originalValue={selectedBase.commander} />
                  <div className="space-y-6">
                    <EditableField
                        field={phone}
                        setField={setPhone}
                        fieldEdit={phoneEdit}
                        setFieldEdit={setPhoneEdit}
                        name="phone"
                        label="Phone Number"
                        Icon={Phone} 
                        disabled={false} 
                        originalValue={selectedBase.phone}/>

                    <EditableField
                      field={email}
                      setField={setEmail}
                      fieldEdit={emailEdit}
                      setFieldEdit={setEmailEdit}
                      name="email"
                      label="Email Address"
                      Icon={Mail}
                      disabled={false}
                      originalValue={selectedBase.email}/>
                  </div>

                </TabsContent>
                <TabsContent value="appView" className="mt-4">
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Configuration Panel */}
                    <div className="space-y-6">
                      <Card className="shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">Header Settings</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => {}}
                            />
                            <label className="text-sm">Show logo on card</label>
                          </div>
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => {}}
                            />
                            <label className="text-sm">Show organization type</label>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">App Tiles</h3>
                          <p className="text-sm text-muted-foreground">
                            Configure what appears on the mobile app
                          </p>
                        </CardHeader>
                        <CardContent>
                          <TileConfiguration
                            tiles={tiles}
                            setTiles={setTiles}
                            entityType="org"
                          />
                        </CardContent>
                      </Card>

                      <div className="flex justify-end gap-2">
                        <Button type="button" onClick={() => {/* handle save */}}>
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Save App Configuration
                        </Button>
                      </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="lg:sticky lg:top-4 h-fit">
                      <Card className="shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">App Preview</h3>
                          <p className="text-sm text-muted-foreground">
                            See how your organization will appear in the app
                          </p>
                        </CardHeader>
                        <CardContent>
                          <AppPreview
                            showHeader={true}
                            headerTitle={selectedBase.name}
                            headerImage={coverImage ?? undefined}
                            tiles={tiles}
                            showLogo={false}
                            showType={false}
                            orgType={""}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
          {appFieldData.show_tables && 
            <TableField tableData={tables} setTableData={setTables} editedTables={editedTables} setEditedTables={setEditedTables} deleteTables={deleteTables} setDeleteTables={setDeleteTables}/>
          }
          <Card>
            <CardContent className="text-center">
              <Button onClick={() => setShowFieldModal(true)}>
                <PlusIcon />
                Add Field
              </Button>
            </CardContent>
          </Card>
          <input type="hidden" name="baseId" value={selectedBase.base_id}/>
          <input type="hidden" name="request-type" value="base-update"/>
          <input type="hidden" name="userId" value={selectedBase.user_id} />
          <Card className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)] col-span-2 items-center">
            <CardContent>
              <Button className="border border-yellow-400 bg-yellow-600/20" type="submit" name="_action" value="submit">Submit Update Request</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </Form>
      {showModal && (
        <UploadModal
          isOpen={showModal}
          onClose={setShowModal}
          setCoverImage={setCoverImage}
        ></UploadModal>
      )}
      {showFieldModal && (
        <FieldTypes setShowModal={setShowFieldModal} setSelectedType={setSelectedType} />
      )}
    </div>
  );
}
