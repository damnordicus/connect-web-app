import { useState } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
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
} from "lucide-react";
import type { Route } from "../+types/home";
import {
  Form,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createClient } from "@supabase/supabase-js";
import UploadModal from "~/components/UploadModal";
import { EditableField } from "~/components/EditableField";
import { categories } from "~/lib/constants";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie');
    if(!cookieHeader){
        return redirect('/');
    }
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            acc[name] = decodeURIComponent(value);
        }
        return acc;
    }, {} as Record<string, string>);
  console.log(cookies.user_id)

  const searchParams = new URL(request.url).searchParams;
  const org = searchParams.get("org");
  console.log("org", org);
  const { data: orgData } = await supabase
    .from("organization")
    .select("*")
    .eq("id", org);
  const { data: requestData, error: requestError} = await supabase
    .from("request")
    .select("*")
    .eq("org_id", org)
    .eq("is_denied", true)
  return { orgData , userId: cookies.user_id, requestData};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const searchParams = new URL(request.url).searchParams;
  const orgId = searchParams.get("org");
  const userId = formData.get("userId");
  const requestId = formData.get("requestId");

  if(requestId){
    const {data, error} = await supabase.from("request").delete().eq("id", requestId);
    return {data}
  }
  
  const {data: requestData, error: requestError} = await supabase.from("request").insert({"created_at": new Date(Date.now()), "org_id": orgId, "data": Object.fromEntries(formData.entries()), "user_id": userId})
  // const toggle = showName === 'on' ? true : false
  console.log(requestError)
  let imageUrl = null;

  
};

export default function OrgDetailsRedesign({
  loaderData,
}: Route.ComponentProps) {
  const { orgData: orgs, userId, requestData } = loaderData;
  console.log('orgData', orgs);
  const orgData = orgs[0];
  const [showModal, setShowModal] = useState(false);
  const [coverImage, setCoverImage] = useState(orgData.image_url);
  const [name, setName] = useState(orgData.name);
  const [nameEdit, setNameEdit] = useState(false);
  const [description, setDescription] = useState(orgData.description);
  const [descriptionEdit, setDescriptionEdit] = useState(false);
  const [poc, setPOC] = useState(orgData.contact);
  const [pocEdit, setPocEdit] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(orgData.type);
  const [showLogo, setShowLogo] = useState(true);
  const [showType, setShowType] = useState(true);
  const [addBadgeToForm, setAddBadgeToForm] = useState(false);

  return (
    <div className="w-full flex-1 overflow-auto p-4 bg-gradient-to-br from-blue-400 to-teal-300">
      <div className="grid gap-4">
        {(requestData && requestData.length > 0) && 
        <Card className="bg-red-300 border-2 border-red-400">
          <CardContent>
            <p>Update requests denied:</p>
            <ul>
            {requestData.map(request => <li className="border rounded-md pl-2 bg-white/30 flex justify-between items-center">- {request.denial_reason}<Form method="POST"><input type="hidden" name="requestId" value={request.id} /><button className="px-2 bg-white rounded-md m-1">Clear</button></Form></li>)}
            </ul>
          </CardContent>
        </Card>}
        <Form method="POST" className="space-y-4">

        {/* Organization Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="relative group">
                  {orgData.image_url && (
                    <img
                    src={orgData.image_url}
                    alt={`${orgData.name} logo`}
                    className="max-h-40 max-w-full object-contain"
                    />
                  )}
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

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h2 className="text-2xl font-bold">{orgData.name}</h2>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                    >
                    <Shield className="h-3 w-3" />
                    {orgData.type}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="shadow-md">
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

                  <Card className="shadow-md">
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
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Basic Information */}
          <Card className="col-span-2">
            <CardHeader>
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">
                    Organization Details
                  </TabsTrigger>
                  <TabsTrigger value="appView">App View</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4 space-y-6">
                  <EditableField
                    label="Organization Name"
                    name="name"
                    field={name}
                    setField={setName}
                    originalValue={orgData.name}
                    Icon={Building}
                    fieldEdit={nameEdit}
                    setFieldEdit={setNameEdit}
                    type="text"
                    disabled={false}
                    />

                  <EditableField
                    label="Description"
                    name="description"
                    field={description}
                    setField={setDescription}
                    originalValue={orgData.description}
                    Icon={Building}
                    fieldEdit={descriptionEdit}
                    setFieldEdit={setDescriptionEdit}
                    type="textarea"
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
                        <p className="text-center text-xl font-bold">{name}</p>
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

          <Card className="col-span-2">
            <CardHeader>
              <Tabs defaultValue="website">
                <TabsList>
                  <TabsTrigger value="website">Website</TabsTrigger>
                  <TabsTrigger value="appView">App View</TabsTrigger>
                </TabsList>
                <TabsContent value="website" className="mt-4">
                  <EditableField label={"Website"} name={"weburl"} field={orgData.web_url} setField={undefined} Icon={Globe} fieldEdit={false} setFieldEdit={undefined} disabled={false} originalValue={""} />
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent>
            </CardContent>
          </Card>

          {/* Category & Type */}
          <Card className="col-span-2">
            <CardHeader>
              <Tabs defaultValue="category">
                <TabsList>
                  <TabsTrigger value="category">Category</TabsTrigger>
                  <TabsTrigger value="appView">App View</TabsTrigger>
                </TabsList>
                <TabsContent value="category" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2 mb-3">
                      <Shield className="h-4 w-4" />
                      <Label>Organization Type</Label>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
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
                      </div>
                      {orgData.type !== selectedBadge && (
                        <div className="flex items-center">
                        
                          
                          <button
                            name="submit"
                            type="button"
                            onClick={() => setAddBadgeToForm(true)}
                            >
                            <SaveIcon size={18} />
                          </button>
                        
                        </div>
                      )}
                      {addBadgeToForm && <input type="hidden" name="type" value={selectedBadge} />}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="appView" className="mt-4">
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      Preview of how the organization type badge appears in the
                      app
                    </p>
                    <div className="w-full h-[120px] bg-white rounded-xl shadow-md flex items-center justify-center border">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-muted-foreground">
                          Organization Type
                        </p>
                        <Badge
                          variant="outline"
                          className={`py-2 px-4 shadow-md border ${
                            categories.find((c) => c.type === selectedBadge)
                            ?.color
                          }`}
                          >
                          {selectedBadge}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Point of Contact */}
          <Card className="col-span-2">
            <CardHeader>
              <Tabs defaultValue="contact">
                <TabsList>
                  <TabsTrigger value="contact">Point of Contact</TabsTrigger>
                  <TabsTrigger value="appView">App View</TabsTrigger>
                </TabsList>
                <TabsContent value="contact" className="mt-4">
                  <EditableField
                    label="Point of Contact"
                    name="contact"
                    field={poc}
                    setField={setPOC}
                    originalValue={orgData.contact}
                    Icon={Users}
                    fieldEdit={pocEdit}
                    setFieldEdit={setPocEdit}
                    type="text"
                    disabled={false}
                    />
                </TabsContent>
                <TabsContent value="appView" className="mt-4">
                  <div className="w-full h-[120px] bg-white rounded-xl shadow-md border flex items-center px-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 rounded-full p-3">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Point of Contact
                        </p>
                        <p className="text-lg font-semibold">{poc}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
          <Card className="col-span-2 items-center">
            <CardContent>
              <Button>Submit Update Request</Button>
            </CardContent>
          </Card>
        </div>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="orgId" value={orgData.id} />
      </Form>
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
