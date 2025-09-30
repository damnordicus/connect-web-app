import { Navigate, Outlet, redirect, useNavigate, type LoaderFunctionArgs } from "react-router";
import type { Route } from "../+types/home";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import React, { useState } from "react";
import { Building, Edit, Edit2, Mail, MapPin, MapPinIcon, Phone, Save, Shield, Users, X } from "lucide-react";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import UploadModal from "~/components/UploadModal";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams
  const baseId = searchParams.get("id");
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
  try {
    const { data } = await supabase.from("baseDetails").select(`*, base(*), user(*)`)
    console.log('bd', data)
    const { count, error } = await supabase.from('organization').select('*', { count: 'exact', head: true }).eq('base_id', baseId)
    console.log('oc: ', count)
    return { data, orgCount: count }

  } catch (error) {
    console.error('Error: ', error)
  }
  return {}
}

  const EditableField = ({label, name, field, setField, Icon, fieldEdit, setFieldEdit}: {label: string, name: string, field: string, setField: any, Icon: any, fieldEdit: boolean, setFieldEdit: any}) => {

    return(
      <div>
        <div className="flex justify-between">
          <div className="flex gap-2 mb-2">
            <Icon className="h-4 w-4" />
            <Label>{label}</Label>
          </div>
          <div>
            {fieldEdit && <div className="flex gap-2">
              <Save className="w-4 h-4 hover:bg-gray-200 hover:rounded" />
              <X onClick={() => setFieldEdit(false)} className="w-4 h-4 hover:bg-gray-200 hover:rounded" />
            </div>}
            {!fieldEdit &&
              <Edit2 onClick={() => setFieldEdit(true)} className="w-4 h-4 hover:bg-gray-200 hover:rounded" />
            }
          </div>
        </div>
        {!fieldEdit && <p className="bg-gray-50 p-2 rounded text-sm font-medium">{field}</p>}
        {fieldEdit && <input type="text" name={name} className="w-full p-2 font-medium text-sm border rounded-lg" value={field} onChange={(e) => setField(e.currentTarget.value)} />}
      </div>
    )
  }

export default function BaseAdmin({ loaderData }: Route.ComponentProps) {
  const { data, orgCount } = loaderData;
  const selectedBase = data[0];
  const [showModal, setShowModal] = useState(false);

 
  const [name, setName] = useState(selectedBase.base.name)
  const [nameEdit, setNameEdit] = useState(false);
  const [motto, setMotto] = useState(selectedBase.motto)
  const [mottoEdit, setMottoEdit] = useState(false);
  const [phone, setPhone] = useState(selectedBase.phone);
  const [phoneEdit, setPhoneEdit] = useState(false);
  const [email, setEmail] = useState(selectedBase.email);
  const [emailEdit, setEmailEdit] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [commander, setCommander] = useState("");
  const [commanderEdit, setCommanderEdit] = useState(false);



  return (
    <div className="w-full flex-1 overflow-auto p-4 bg-linear-to-br from-blue-400 to-teal-300">
      <div className="grid gap-8">
        {/* Base Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Base Cover Image</Label>
                  <div className="relative group">
                    <img
                      src={selectedBase.image_url ?? "http://cataas.com/cat"}
                      alt={`${selectedBase.name} cover`}
                      className="w-full h-100 object-cover rounded-lg border"
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
                  <h2 className="text-2xl font-bold text-balance">{selectedBase.base.name}</h2>
                  <Badge variant="secondary" className="flex items-center gap-1">
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
                        <span className="font-medium text-xl">{selectedBase.population || 0}</span>
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EditableField label={"Base Name"} name="name" field={name} setField={setName} Icon={Building} fieldEdit={nameEdit} setFieldEdit={setNameEdit} />

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <div className="p-2 rounded-md bg-muted/50 text-sm">
                  {selectedBase.base.city}, {selectedBase.base.state}
                </div>
                <p className="text-xs text-muted-foreground">Location cannot be modified</p>
              </div>

              <EditableField field={motto} label="Base Motto" setField={setMotto} Icon={Building} fieldEdit={mottoEdit} setFieldEdit={setMottoEdit} type="textarea" />
            </CardContent>
          </Card>

          {/* Command & Personnel */}
          <Card>
            <CardHeader>
              <CardTitle>Command & Personnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EditableField field={commander} name="commander" setField={setCommander} label="Base Commander" fieldEdit={commanderEdit} setFieldEdit={setCommanderEdit} Icon={Shield} />
                
              {/* <EditableField
                field="population"
                label="Base Population"
                value={selectedBase.population || 0}
                icon={Users}
              />

              <EditableField
                field="organizations"
                label="Number of Organizations"
                value={selectedBase.organizations || ""}
                icon={Building}
              /> */}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <EditableField field={phone} setField={setPhone} fieldEdit={phoneEdit} setFieldEdit={setPhoneEdit} name="phone" label="Phone Number"  Icon={Phone} />

                <EditableField field={email} setField={setEmail} fieldEdit={emailEdit} setFieldEdit={setEmailEdit} name="email" label="Email Address" Icon={Mail} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {showModal && <UploadModal isOpen={showModal} onClose={setShowModal} setCoverImage={setCoverImage}></UploadModal>}
    </div>
  )
}