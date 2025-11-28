import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Building,
  Edit2,
  Save,
  X,
  Users,
  Mail,
  Shield,
  SaveIcon,
  Image as ImageIcon,
  Palette,
  Globe,
  Pin,
  MapIcon,
  MapPin,
  Map,
  PlusSquareIcon,
  EllipsisVertical,
  PlusIcon,
  RectangleEllipsis,
  XIcon,
  LinkIcon,
} from "lucide-react";
import type { Route } from "../+types/home";
import {
  Form,
  redirect,
  useActionData,
  useNavigate,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createClient } from "@supabase/supabase-js";
import UploadModal from "~/components/UploadModal";
import { EditableField } from "~/components/EditableField";
import { ADDITIONAL_FIELDS, categories } from "~/lib/constants";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "~/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "~/components/ui/dropdown-menu";
import FieldTypes from "~/components/FieldTypes";
import TableField from "~/components/TableField";
import { useLinks } from "~/hooks/useLinks";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return redirect('/');
  }
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      acc[name] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
  // console.log(cookies.user_id)

  const searchParams = new URL(request.url).searchParams;
  const org = searchParams.get("id");
  const { data: orgData } = await supabase
    .from("organization")
    .select("*")
    .eq("id", org)
    .single();
  // console.log(orgData)

  if (!orgData) return {}

  const { data: requestData, error: requestError } = await supabase
    .from("request")
    .select("*")
    .eq("org_id", org)
    .eq("is_denied", true)
  return { orgData, userId: cookies.user_id, requestData };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const searchParams = new URL(request.url).searchParams;
  const orgId = searchParams.get("id");
  const userId = formData.get("userId");
  const requestId = formData.get("requestId");
  const coverImage = formData.get("coverImage") as File;
  const coverImagePath = formData.get("coverImage-path") as string;

  if(formData.get("option")){
    const {data: optionData, error} = await supabase.from("organization").update({"use_tables": true}).eq("id", orgId);
    return {success: true, message: "organization updated"}
  }

  if (coverImagePath) {
    formData.append('image_url', coverImagePath);
    formData.delete('coverImage-path')
  }
  const image = formData.get("image");
  let file = null;

  console.log('test formData: ', formData)

  if (requestId) {
    const { data, error } = await supabase.from("request").delete().eq("id", requestId);
    return { data }
  }

  if (coverImage) {
    const baseId = await supabase.from('organization').select('base_id').eq('id', orgId).single();
    const fileExt = coverImage.name.split('.').pop();
    const fileName = `bases/${baseId}/organizations/${orgId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    file = fileName;
    const { data: imageData, error: imageError } = await supabase.storage.from("images").upload(fileName, coverImage, {
      cacheControl: '3600', upsert: false
    })
    if (imageError)
      return { imageError }

    return { fileName }
  }

  console.log(formData)
  const { data: requestData, error: requestError } = await supabase.from("request").insert({ "created_at": new Date(Date.now()), "org_id": orgId, "data": Object.fromEntries(formData.entries()), "user_id": userId, "request_type": "org-update" })
  // const toggle = showName === 'on' ? true : false
  console.log(requestError)
  let imageUrl = null;


};

export default function OrgDetailsRedesign({
  loaderData,
  actionData
}: Route.ComponentProps) {
  const { orgData, userId, requestData } = loaderData;
  const [fields, setFields] = useState({
    name: {value: orgData?.name, isEditing: false},
    description: {value: orgData?.description, isEditing: false},
    poc: {value: orgData?.contact, isEditing: false},
    selectedBadge: {value: orgData?.type, addBadgeToForm: false},
    webUrl: {value: orgData?.web_url, isEditing: false},
    building: {value: orgData?.building_number, isEditing: false},
    address: {value: orgData?.address, isEditing: false},
  })

  const updateFieldValue = (fieldName: string) => (value: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], value}
    }))
  }

  const updateFieldEdit = (fieldName: string) => (isEditing: boolean) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], isEditing }
    }));
  }

  const [showModal, setShowModal] = useState(false);
  const [coverImage, setCoverImage] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string>(orgData?.image_url)
  // const [name, setName] = useState(orgData?.name);
  // const [nameEdit, setNameEdit] = useState(false);
  // const [description, setDescription] = useState(orgData?.description);
  // const [descriptionEdit, setDescriptionEdit] = useState(false);
  // const [poc, setPOC] = useState(orgData?.contact);
  // const [pocEdit, setPocEdit] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(orgData?.type);
  const [showLogo, setShowLogo] = useState(true);
  const [showType, setShowType] = useState(true);
  const [addBadgeToForm, setAddBadgeToForm] = useState(false);
  // const [webUrl, setWebUrl] = useState(orgData?.web_url);
  // const [webEdit, setWebEdit] = useState(false);
  // const [building, setBuilding] = useState(orgData?.building_number);
  // const [buildingEdit, setBuildingEdit] = useState(false);
  // const [address, setAddress] = useState(orgData?.address);
  // const [addressEdit, setAddressEdit] = useState(false);
  const [fieldsModal, setFieldsModal] = useState(false);
  const [selectedType, setSelectedType] = useState(-1);
  const [tables, setTables] = useState(orgData?.table_data)

  const linkManager = useLinks(orgData?.links);

  // Reset addBadgeToForm when original badge is reselected
  useEffect(() => {
    setAddBadgeToForm(false);
  }, [selectedBadge]);

  useEffect(() => {
    console.log(actionData)
    if(actionData && actionData.success){
      setFieldsModal(false)
    }
  },[actionData])

  // Determine badge state
  const badgeChanged = orgData.type !== selectedBadge;
  const shouldShowSaveButton = badgeChanged;
  const shouldRenderHiddenInput = badgeChanged && addBadgeToForm;

 

  return (
    <div className="w-full flex-1 overflow-auto">
      <div className="grid gap-4">
        {(requestData && requestData.length > 0) &&
          <Card className="bg-red-600/15 border-1 border-red-500/30">
            <CardContent>
              <p>Update requests denied:</p>
              <ul>
                {requestData.map(request => <li className="border rounded-md pl-2 bg-primary/30 flex justify-between items-center">- {request.denial_reason}<Form method="POST"><input type="hidden" name="requestId" value={request.id} /><button className="px-2 py-1 bg-red-600/50 border rounded-md m-1">Clear</button></Form></li>)}
              </ul>
            </CardContent>
          </Card>}
        <Form method="POST" className="space-y-4" >

          {/* Organization Header Card */}
          <Card className="rounded-lg m-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <CardContent className="">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="relative group p-4 rounded-lg place-self-center">
                    {orgData.image_url && (
                      <img
                        src={orgData.image_url}
                        alt={`${orgData.name} logo`}
                        className="max-h-40 max-w-full object-contain"
                      />
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowModal(true)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {((originalImage !== coverImage) && coverImage !== "") && <input type="hidden" name="coverImage-path" value={coverImage} />}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-2xl font-bold">{orgData.name}</h2>
                    <Badge
                      variant="secondary"
                      className={`py-2 px-3 shadow-md border cursor-pointer ${categories.find(item => item.type === orgData.type).color
                        }`}
                    >
                      <Shield className="h-3 w-3" />
                      {orgData.type}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                      <CardContent className="flex flex-col justify-center text-center space-y-1 py-4">
                        <div className="flex gap-2 items-center justify-center">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Contact</p>
                        </div>
                        <span className="font-medium text-sm">
                          {orgData.contact}
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                      <CardContent className="flex flex-col justify-center text-center space-y-1 py-4">
                        <div className="flex gap-2 items-center justify-center">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Status</p>
                        </div>
                        <span className="text-green-600 text-xl">Active</span>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Information Cards */}
          <div className="grid lg:grid-cols-2 mx-4 gap-4">
            {/* Basic Information */}
            <Card className="col-span-2 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <CardHeader>
                <Tabs defaultValue="details">
                  <TabsList className="bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                    <TabsTrigger className="data-[state=active]:!bg-primary" value="details">
                      Organization Details
                    </TabsTrigger>
                    <TabsTrigger className="data-[state=active]:!bg-primary" value="appView">App View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="mt-4 space-y-6">
                    <EditableField
                      label="Organization Name"
                      name="name"
                      field={fields.name.value}
                      setField={updateFieldValue('name')}
                      originalValue={orgData?.name}
                      Icon={Building}
                      fieldEdit={fields.name.isEditing}
                      setFieldEdit={updateFieldEdit('name')}
                      type="text"
                      disabled={false}
                    />

                    <EditableField
                      label="Description"
                      name="description"
                      field={fields.description.value}
                      setField={updateFieldValue('description')}
                      originalValue={orgData?.description}
                      Icon={Building}
                      fieldEdit={fields.description.isEditing}
                      setFieldEdit={updateFieldEdit('description')}
                      type="textarea"
                      disabled={false}
                    />

                    <EditableField 
                      label={"Building Number"} 
                      name={"building_number"} 
                      field={fields.building.value} 
                      setField={updateFieldValue('building')} 
                      Icon={MapPin} 
                      fieldEdit={fields.building.isEditing} 
                      setFieldEdit={updateFieldEdit('building')} 
                      disabled={false} 
                      originalValue={orgData?.building_number} />

                    <EditableField 
                      label={"Address"} 
                      name={"address"} 
                      field={fields.address.value} 
                      setField={updateFieldValue('address')} 
                      Icon={Map} 
                      fieldEdit={fields.address.isEditing} 
                      setFieldEdit={updateFieldEdit('address')} 
                      disabled={false} 
                      originalValue={orgData?.address} />
                    
                    <EditableField
                      label={"Website"}
                      name={"weburl"}
                      field={fields.webUrl.value}
                      setField={updateFieldValue('webUrl')}
                      Icon={Globe}
                      fieldEdit={fields.webUrl.isEditing}
                      setFieldEdit={updateFieldEdit('webUrl')}
                      disabled={false}
                      originalValue={orgData?.web_url} />

                    <div className="space-y-4">
                      <div className="flex gap-2 mb-3">
                        <Shield className="h-4 w-4" />
                        <Label>Organization Type</Label>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2">
                        <div className={`space-x-2 p-2 rounded-lg`}>
                          {categories.map((item, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              onClick={() => setSelectedBadge(item.type)}
                              className={`py-2 px-3 shadow-md border cursor-pointer ${selectedBadge === item.type ? item.color : "bg-background/20"
                                } hover:-translate-y-1 hover:shadow-lg transition-all`}
                            >
                              {item.type}
                            </Badge>
                          ))}
                        </div>
                        {shouldShowSaveButton && (
                          <div className="flex items-center">
                            <button
                              name="submit"
                              type="button"
                              onClick={() => setAddBadgeToForm(true)}
                              disabled={addBadgeToForm}
                              className={`transition-colors ${addBadgeToForm
                                  ? 'text-gray-600 cursor-not-allowed'
                                  : 'text-white hover:text-gray-200'
                                }`}
                            >
                              <SaveIcon size={18} />
                            </button>
                          </div>
                        )}
                        {shouldRenderHiddenInput && <input type="hidden" name="type" value={selectedBadge} />}
                      </div>
                    </div>

                    <EditableField
                      label="Point of Contact"
                      name="contact"
                      field={fields.poc.value}
                      setField={updateFieldValue('poc')}
                      originalValue={orgData.contact ?? ""}
                      Icon={Users}
                      fieldEdit={fields.poc.isEditing}
                      setFieldEdit={updateFieldEdit('poc')}
                      type="text"
                      disabled={false}
                    />
                  </TabsContent>
                  <TabsContent value="appView" className="mt-4">
                    <div className="flex gap-4">
                      <div className="relative flex flex-col w-1/2  gap-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={showLogo}
                            onCheckedChange={() => setShowLogo(!showLogo)}
                          />
                          <label className="text-sm">Show logo on card?</label>
                        </div>
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={showType}
                            onCheckedChange={() => setShowType(!showType)}
                          />
                          <label className="text-sm">
                            Show organization type?
                          </label>
                        </div>
                        <Button variant="outline" className="w-full">
                          <SaveIcon size={18} />
                          Save
                        </Button>
                      </div>
                      <div
                        className="relative w-full h-[200px] mx-auto rounded-xl shadow-lg p-6 border-3"
                      >
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                          {showLogo && orgData.image_url && (
                            <img
                              src={orgData.image_url}
                              alt="Logo"
                              className="h-20 w-20 object-contain"
                            />
                          )}
                          <p className="text-center text-xl font-bold">{fields.name.value}</p>
                          {showType && (
                            <Badge variant="secondary">{selectedBadge}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>

            <Card className="col-span-2 rounded-lg gap-2">
              <CardHeader className="">
                <div className="inline-flex gap-2 items-center">
                <LinkIcon size={14}/>
                <p>Links</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                    {[...linkManager.existingLinks, ...linkManager.links].map((link, index) => {
                      const isEditing = linkManager.editingIndex === index;
                      return (
                        <Card className="py-2 rounded-lg bg-background/20" >
                          <CardContent className="relative flex flex-col">
                            {!isEditing ?
                              <>
                                <p className="text-lg">{link.label}</p>
                                <p className="italic text-gray-400 ">{link.link}</p>
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="absolute top-1 right-1" asChild>
                                    <EllipsisVertical size={20} className="" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => linkManager.startEditLink(index, link)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => linkManager.deleteLink(index)}>Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>

                              : <>
                                <div className="flex flex-col gap-4 w-full">
                                  <div className="space-y-2">
                                    <p>Label: </p>
                                    <input type="text" value={linkManager.editedLink.label} className="bg-background/20 w-full p-2 border border-border rounded-lg text-sm font-medium text-foreground" onChange={(e) => linkManager.setEditedLink({ ...linkManager.editedLink, label: e.currentTarget.value })} />
                                  </div>
                                  <div className="space-y-2">
                                    <p>Link Address: </p>
                                    <input type="text" value={linkManager.editedLink.link} className="bg-background/20 w-full p-2 border border-border rounded-lg text-sm font-medium text-foreground" onChange={(e) => linkManager.setEditedLink({ ...linkManager.editedLink, link: e.currentTarget.value })} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant={"default"} className="hover:bg-blue-600 border" onClick={() => linkManager.saveEditedLink(index)}><SaveIcon />Save Link</Button>
                                    <Button variant={"ghost"} className="border " onClick={() => linkManager.setEditingIndex(null)}>Cancel</Button>
                                  </div>
                                </div>
                              </>
                            }

                          </CardContent>
                        </Card>
                      )
                    })}
                    {(linkManager.links.length > 0 || linkManager.update) && (
                      <input type="hidden" name="links" value={JSON.stringify([...(linkManager.existingLinks || []), ...linkManager.links])} />
                    )}
                    <Card className="py-2 rounded-lg bg-background/20">
                      <CardContent className="flex w-full ">
                        {!linkManager.showAddLink ? <div className="flex w-full justify-between">
                          <p>Add New Link</p>
                          <PlusSquareIcon className="hover:text-gray-400" size={24} onClick={() => linkManager.setShowAddLink(true)} />
                        </div> : <div className="flex flex-col gap-4 w-full">
                          <div className="space-y-2">
                            <p>Label: </p>
                            <input type="text" value={linkManager.newLink.label} className="bg-background/20 w-full p-2 border border-border rounded-lg text-sm font-medium text-foreground" onChange={(e) => linkManager.setNewLink({ ...linkManager.newLink, label: e.currentTarget.value })} />
                          </div>
                          <div className="space-y-2">
                            <p>Link Address: </p>
                            <input type="text" value={linkManager.newLink.link} className="bg-background/20 w-full p-2 border border-border rounded-lg text-sm font-medium text-foreground" onChange={(e) => linkManager.setNewLink({ ...linkManager.newLink, link: e.currentTarget.value })} />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant={"default"} className="hover:bg-blue-600 border" onClick={linkManager.handleAddLink}><PlusIcon />Add Link</Button>
                            <Button variant={"ghost"} className="border " onClick={() => linkManager.setShowAddLink(false)}>Cancel</Button>
                          </div>
                        </div>}
                      </CardContent>
                    </Card>
                  </CardContent>
            </Card>
            {orgData.use_tables && 
              <TableField tableData={tables} setTableData={setTables}/>
            }
            <Card className=" rounded-lg">
              <CardContent className="flex justify-center items-center w-full">
                <Button type="button" onClick={() => setFieldsModal(true)} className="flex gap-2">
                  <PlusIcon />
                  <p>Add Field</p>
                </Button>
              </CardContent>
            </Card>
            <Card className=" items-center rounded-lg">
              <CardContent>
                <Button className="border border-yellow-400 bg-yellow-600/20" >Submit Update Request</Button>
              </CardContent>
            </Card>
          </div>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="orgId" value={orgData?.id} />
          {actionData && <input type="hidden" name="image" value={actionData.fileName} />}
        </Form>
      </div>
      {showModal && (
        <UploadModal
          isOpen={showModal}
          onClose={setShowModal}
          setCoverImage={setCoverImage}
          baseId={orgData.base_id}
        ></UploadModal>
      )}
      {fieldsModal &&
        <FieldTypes setShowModal={setFieldsModal} setSelectedType={setSelectedType}/>}
    </div>
  );
}