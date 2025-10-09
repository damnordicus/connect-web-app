import { Form } from "react-router";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Building, Edit } from "lucide-react";
import { EditableField } from "./EditableField";
import { useState } from "react";
import { Button } from "./ui/button";

export default function DataRequestModal({ requestData, existingData }) {
  // console.log(requestData, existingData);
  const [name, setName] = useState(requestData.organization.name);
  const [nameEdit, setNameEdit] = useState(false);
  const [description, setDescription] = useState(requestData.description);
  const [descriptionEdit, setDescriptionEdit] = useState(false);
  // console.log(Object.entries(requestData.data));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <Card className="w-1/4 md:w-3/4 ">
        <CardHeader>
          <p className="text-2xl">{requestData.organization.name}</p>
        </CardHeader>
        <CardContent className="">
          <Form method="POST" encType="multipart/form-data">
            {Object.entries(requestData.data).map(
              ([key, value]: [string, any]) => {
                if(key !== "submit" && key !== "userId")
                return(
                  <EditableField
                    label={key.toUpperCase().slice(0, 1) + key.slice(1) + ":"}
                    name={key}
                    field={value}
                    setField={setName}
                    Icon={Building}
                    fieldEdit={nameEdit}
                    setFieldEdit={undefined}
                    disabled={false}
                  />
                )}
            )}
            <div className="flex justify-center mt-4 gap-2">
            <Button className="text-center bg-green-500">Approve Changes</Button>
            <Button className="text-center bg-red-500">Deny Changes</Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
