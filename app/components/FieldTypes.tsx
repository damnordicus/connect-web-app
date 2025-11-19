import { RectangleEllipsis, XIcon } from "lucide-react";
import { ADDITIONAL_FIELDS } from "~/lib/constants";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import type React from "react";
import { useState, type SetStateAction } from "react";
import { Form } from "react-router";

export default function FieldTypes ({setShowModal, setSelectedType}: {setShowModal: React.Dispatch<SetStateAction<boolean>>, setSelectedType: React.Dispatch<SetStateAction<number>>}) {
    const [selection, setSelection] = useState(-1);
    return (
        <div className="absolute inset-0 backdrop-blur-xs flex items-center justify-center w-full h-screen bg-black/30">
          <Form method="POST">
        <Card className="relative flex rounded-lg">

          <CardHeader className="flex items-center gap-4">
            {/* <div className="rounded-full p-2 bg-white/10"> */}
            <RectangleEllipsis className="text-gray-500"/>
            {/* </div> */}
            Field Types
            <XIcon className="absolute top-4 right-4 text-gray-500 hover:text-white" onClick={() => setShowModal(false)}/>
          </CardHeader>
          <CardContent className="space-y-3 ">
            {ADDITIONAL_FIELDS.map((field, index) => 
            <Card className={`border-2 ${selection === index ? 'bg-primary/40' : ''} rounded-lg hover:bg-gray-400/20 hover:cursor-pointer hover:border-gray-500`} onClick={() => setSelection(index)}>
              <CardContent className="flex w-full items-center gap-4 ">
                <div>
                  {field.icon}
                </div>
                <div className="flex flex-col">
                  <p>{field.name}</p>
                  <p className="text-sm opacity-40">{field.description}</p>
                </div>
              </CardContent>
            </Card>)}
            <input type="hidden" name="option" value={selection}/>
          </CardContent>
          <CardFooter className="flex w-full justify-end">
              <Button type="submit" >Add Field</Button>
          </CardFooter>
        </Card>
              </Form>
      </div>
    )
}