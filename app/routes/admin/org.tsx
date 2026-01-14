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
  // Map,
  PlusSquareIcon,
  EllipsisVertical,
  PlusIcon,
  RectangleEllipsis,
  XIcon,
  LinkIcon,
  Quote,
  Phone,
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
import TableField, { type TableData } from "~/components/TableField";
import { useLinks } from "~/hooks/useLinks";
import TileConfiguration, { type BaseDataField, type TileData } from "~/components/TileConfiguration";
import AppPreview from "~/components/AppPreview";
import { loadTiles, TileTemplates } from "~/lib/tileUtils";
import DocumentManager from "~/components/DocumentManager";
import type { PendingDocumentUpload } from "~/components/DocumentUpload";
import type { Document, DocumentFolder } from "~/types/documents";


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

  // Fetch documents and folders
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", "org")
    .eq("entity_id", org)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const folders = orgData?.document_folders?.folders || [];

  return { orgData, userId: cookies.user_id, requestData, documents: documents || [], folders, baseId: orgData?.base_id };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const searchParams = new URL(request.url).searchParams;
  const orgId = searchParams.get("id");
  const userId = formData.get("userId");
  const requestId = formData.get("requestId");
  const coverImage = formData.get("coverImage") as File;
  const coverImagePath = formData.get("coverImage-path") as string;

  if (formData.get("option")) {
    const { data: optionData, error } = await supabase.from("organization").update({ "use_tables": true }).eq("id", orgId);
    return { success: true, message: "organization updated" }
  }

  if (coverImagePath) {
    formData.append('image_url', coverImagePath);
    formData.delete('coverImage-path')
  }
  const image = formData.get("image");
  let file = null;

  // console.log('test formData: ', formData)

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

  // Handle folder operations
  const actionType = formData.get("actionType");

  if (actionType === "create-folder") {
    const folderName = formData.get("folderName") as string;
    const parentPath = formData.get("parentPath") as string;
    const existingFolders = JSON.parse(formData.get("folders") as string || "[]");

    // Generate new folder
    const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const parentFolder = parentPath === "/" ? null : existingFolders.find((f: any) => f.path === parentPath)?.id || null;
    const newPath = parentPath === "/" ? `/${folderName}` : `${parentPath}/${folderName}`;

    const newFolder = {
      id: newFolderId,
      name: folderName,
      path: newPath,
      parent: parentFolder
    };

    const updatedFolders = [...existingFolders, newFolder];

    const { error: updateError } = await supabase
      .from("organization")
      .update({ document_folders: { folders: updatedFolders } })
      .eq("id", orgId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true, message: "Folder created", folder: newFolder };
  }

  if (actionType === "rename-folder") {
    const folderId = formData.get("folderId") as string;
    const newName = formData.get("newName") as string;
    const existingFolders = JSON.parse(formData.get("folders") as string || "[]");

    // Find and update the folder
    const folderIndex = existingFolders.findIndex((f: any) => f.id === folderId);
    if (folderIndex === -1) {
      return { error: "Folder not found" };
    }

    const folder = existingFolders[folderIndex];
    const oldPath = folder.path;
    const pathParts = oldPath.split("/").filter(Boolean);
    pathParts[pathParts.length - 1] = newName;
    const newPath = "/" + pathParts.join("/");

    // Update the folder
    existingFolders[folderIndex] = {
      ...folder,
      name: newName,
      path: newPath
    };

    // Update all child folders' paths
    existingFolders.forEach((f: any, i: number) => {
      if (f.path.startsWith(oldPath + "/")) {
        existingFolders[i] = {
          ...f,
          path: f.path.replace(oldPath, newPath)
        };
      }
    });

    // Update organization's folders
    const { error: updateError } = await supabase
      .from("organization")
      .update({ document_folders: { folders: existingFolders } })
      .eq("id", orgId);

    if (updateError) {
      return { error: updateError.message };
    }

    // Update documents with old path to new path
    await supabase
      .from("documents")
      .update({ folder_path: newPath })
      .eq("entity_type", "org")
      .eq("entity_id", orgId)
      .eq("folder_path", oldPath);

    // Update documents in child folders
    const { data: childDocs } = await supabase
      .from("documents")
      .select("id, folder_path")
      .eq("entity_type", "org")
      .eq("entity_id", orgId)
      .like("folder_path", `${oldPath}/%`);

    if (childDocs) {
      for (const doc of childDocs) {
        await supabase
          .from("documents")
          .update({ folder_path: doc.folder_path.replace(oldPath, newPath) })
          .eq("id", doc.id);
      }
    }

    return { success: true, message: "Folder renamed" };
  }

  if (actionType === "delete-folder") {
    const folderId = formData.get("folderId") as string;
    const existingFolders = JSON.parse(formData.get("folders") as string || "[]");

    // Find the folder to delete
    const folder = existingFolders.find((f: any) => f.id === folderId);
    if (!folder) {
      return { error: "Folder not found" };
    }

    const folderPath = folder.path;

    // Get all folders to delete (the folder and its children)
    const foldersToDelete = existingFolders.filter((f: any) =>
      f.id === folderId || f.path.startsWith(folderPath + "/")
    );
    const folderIdsToDelete = new Set(foldersToDelete.map((f: any) => f.id));

    // Remove folders from the list
    const updatedFolders = existingFolders.filter((f: any) => !folderIdsToDelete.has(f.id));

    // Update organization's folders
    const { error: updateError } = await supabase
      .from("organization")
      .update({ document_folders: { folders: updatedFolders } })
      .eq("id", orgId);

    if (updateError) {
      return { error: updateError.message };
    }

    // Soft delete documents in the folder and its children
    await supabase
      .from("documents")
      .update({ is_deleted: true })
      .eq("entity_type", "org")
      .eq("entity_id", orgId)
      .eq("folder_path", folderPath);

    await supabase
      .from("documents")
      .update({ is_deleted: true })
      .eq("entity_type", "org")
      .eq("entity_id", orgId)
      .like("folder_path", `${folderPath}/%`);

    return { success: true, message: "Folder deleted" };
  }

  // Handle document uploads
  let documentsMetadata = {};
  const documentsInfo = formData.get("documents");
  if (documentsInfo) {
    const docInfo = JSON.parse(documentsInfo as string);
    const uploadedFiles: Record<string, any> = {};

    // Upload each file to storage
    for (let i = 0; i < docInfo.count; i++) {
      const file = formData.get(`documentFile_${i}`) as File;
      if (file && file.size > 0) {
        // console.log('file: ', file.name, 'size:', file.size, 'type:', file.type)
        const fileExt = file.name.split('.').pop();
        const storagePath = `documents/${orgId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError) {
          uploadedFiles[file.name] = {
            name: file.name,
            size: file.size,
            type: file.type,
            storage_path: storagePath
          };
          // console.log('Successfully uploaded:', file.name, 'to', storagePath);
        } else {
          console.error('Upload error for', file.name, ':', uploadError);
        }
      }
    }

    documentsMetadata = uploadedFiles;
  }

  // Build the request data
  const requestDataObj = Object.fromEntries(formData.entries());

  // Add document metadata to the request data
  if (Object.keys(documentsMetadata).length > 0) {
    requestDataObj.documents = documentsMetadata;
    requestDataObj.folderPath = formData.get("folderPath") || "/";
    requestDataObj.description = formData.get("description") || "";
    // console.log('✅ Documents uploaded successfully:', Object.keys(documentsMetadata).length, 'files');
    // console.log('📁 Folder:', requestDataObj.folderPath);
    // console.log('📝 Description:', requestDataObj.description);
  }

  // console.log('📦 Final request data:', JSON.stringify(requestDataObj, null, 2));
  const { data: requestData, error: requestError } = await supabase.from("request").insert({ "created_at": new Date(Date.now()), "org_id": orgId, "data": requestDataObj, "user_id": userId, "request_type": "org-update" })

  if (requestError) {
    console.error('❌ Request insert error:', requestError);
  } else {
    // console.log('✅ Request created successfully:', requestData);
  }
  let imageUrl = null;


};

export default function OrgDetailsRedesign({
  loaderData,
  actionData
}: Route.ComponentProps) {
  const { orgData, userId, requestData } = loaderData;
  const [fields, setFields] = useState({
    name: { value: orgData?.name, isEditing: false },
    description: { value: orgData?.description, isEditing: false },
    poc: { value: orgData?.contact, isEditing: false },
    selectedBadge: { value: orgData?.type, addBadgeToForm: false },
    webUrl: { value: orgData?.web_url, isEditing: false },
    building: { value: orgData?.building_number, isEditing: false },
    address: { value: orgData?.address, isEditing: false },
  })

  const updateFieldValue = (fieldName: string) => (value: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], value }
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
  const [useTables, setUseTables] = useState<boolean>(orgData?.use_tables ?? false)
  const [editedTables, setEditedTables] = useState<TableData[]>([])
  const [deleteTables, setDeleteTables] = useState<TableData[]>([])

  const linkManager = useLinks(orgData?.links);

  const baseDataFields: BaseDataField[] = [
    {
      key: "org_name",
      label: "Organization Name",
      value: orgData?.name,
      icon: Building,
    },
    {
      key: "description",
      label: "Description",
      value: orgData?.description,
      icon: Building,
    },
    {
      key: "contact",
      label: "Point of Contact",
      value: orgData?.contact,
      icon: Mail,
    },
    {
      key: "phone",
      label: "Contact Phone",
      value: orgData?.phone,
      icon: Phone,
    },
    {
      key: "email",
      label: "Contact Email",
      value: orgData?.email,
      icon: Mail,
    },
  ];

  const [tiles, setTiles] = useState<TileData[]>(() => {
    return loadTiles(
      orgData?.tiles_config,
      [
        TileTemplates.textOnly("Organization Info", orgData?.description || ""),
        TileTemplates.contactInfo(orgData?.phone, orgData?.email)
      ]
    );
  });

  const [pendingDocuments, setPendingDocuments] = useState<PendingDocumentUpload | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleDocumentSubmit = async (data: PendingDocumentUpload) => {
    // Just store the data for now - it will be included in the form submission
    // The actual file upload will happen in the action function
    setPendingDocuments(data);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (pendingDocuments && pendingDocuments.files.length > 0) {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);

      // Add document files manually
      pendingDocuments.files.forEach((file, index) => {
        formData.append(`documentFile_${index}`, file);
      });

      // Submit the form with the files
      fetch(window.location.href, {
        method: 'POST',
        body: formData,
      }).then(() => {
        window.location.reload();
      });
    }
  };

  // Reset addBadgeToForm when original badge is reselected
  useEffect(() => {
    setAddBadgeToForm(false);
  }, [selectedBadge]);

  useEffect(() => {
    // console.log(actionData)
    if (actionData && actionData.success) {
      setFieldsModal(false)
    }
  }, [actionData])

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
        <Form method="POST" className="space-y-4" onSubmit={handleFormSubmit}>

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
                    <TabsTrigger className="data-[state=active]:!bg-primary" value="documents">Documents</TabsTrigger>
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
                      Icon={MapPin}
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
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Configuration Panel */}
                      <div className="space-y-6">
                        <Card className="border rounded-lg">
                          <CardHeader className="">
                            <h3 className="text-lg font-semibold">Header Settings</h3>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={false}
                                onCheckedChange={() => { }}
                              />
                              <label className="text-sm">Show logo on card</label>
                            </div>
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={false}
                                onCheckedChange={() => { }}
                              />
                              <label className="text-sm">Show organization type</label>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="border rounded-lg">
                          <div className="px-6 my-4">
                            <h3 className="text-lg font-semibold">App Tiles</h3>
                            <p className="text-sm text-muted-foreground">
                              Configure what appears on the mobile app
                            </p>
                          </div>
                          <CardContent>
                            <TileConfiguration
                              tiles={tiles}
                              setTiles={setTiles}
                              entityType="org"
                              baseData={baseDataFields}
                              tables={tables}
                            />
                          </CardContent>
                        </div>

                        {/* <div className="flex justify-end gap-2"> 
                            <Button type="button" onClick={() => {}}>
                            <SaveIcon className="h-4 w-4 mr-2" />
                            Save App Configuration
                          </Button>
                        </div>*/}
                      </div>

                      {/* Preview Panel */}
                      <div className="lg:sticky lg:top-4 h-fit">
                        <Card className="rounded-lg">
                          <CardHeader>
                            <h3 className="text-lg font-semibold">App Preview</h3>
                            <p className="text-sm text-muted-foreground">
                              See how your organization will appear in the app
                            </p>
                          </CardHeader>
                          <CardContent>
                            <AppPreview
                              showHeader={true}
                              headerTitle={orgData.name}
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
                  <TabsContent value="documents" className="mt-4">
                    <DocumentManager
                      documents={loaderData.documents || []}
                      folders={loaderData.folders || []}
                      entityType="org"
                      entityId={orgData.id}
                      baseId={loaderData.baseId}
                      userId={userId}
                      canUpload={true}
                      canDelete={true}
                      onDocumentSubmit={handleDocumentSubmit}
                    />
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>

            <Card className="col-span-2 rounded-lg gap-2">
              <CardHeader className="">
                <div className="inline-flex gap-2 items-center">
                  <LinkIcon size={14} />
                  <p>Links</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...linkManager.existingLinks, ...linkManager.links].map((link, index) => {
                  // console.log(link)
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
            {useTables &&
              <TableField tableData={tables} setTableData={setTables} editedTables={editedTables} setEditedTables={setEditedTables} deleteTables={deleteTables} setDeleteTables={setDeleteTables} />
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
          {pendingDocuments && (
            <>
              <input type="hidden" name="folderPath" value={pendingDocuments.folderPath} />
              <input type="hidden" name="description" value={pendingDocuments.description} />
              <input
                type="hidden"
                name="documents"
                value={JSON.stringify({
                  count: pendingDocuments.files.length,
                  files: pendingDocuments.files.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type
                  }))
                })}
              />
            </>
          )}
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
        <FieldTypes setShowModal={setFieldsModal} setSelectedType={setSelectedType} />}
    </div>
  );
}