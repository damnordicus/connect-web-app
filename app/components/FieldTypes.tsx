import { RectangleEllipsis, XIcon } from "lucide-react";
import { ADDITIONAL_FIELDS } from "~/lib/constants";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import type React from "react";
import type { SetStateAction } from "react";

export default function FieldTypes ({setShowModal}: {setShowModal: React.Dispatch<SetStateAction<boolean>>}) {
    return (
        <div className="absolute inset-0 backdrop-blur-xs flex items-center justify-center w-full h-screen bg-black/30">
        <Card className="relative flex">
          <CardHeader className="flex items-center gap-4">
            {/* <div className="rounded-full p-2 bg-white/10"> */}
            <RectangleEllipsis className="text-gray-500"/>
            {/* </div> */}
            Field Types
            <XIcon className="absolute top-4 right-4 text-gray-500 hover:text-white" onClick={() => setShowModal(false)}/>
          </CardHeader>
          <CardContent className="space-y-3 ">
            {ADDITIONAL_FIELDS.map((field, index) => 
            <Card className={`shadow-[0_4px_16px_rgba(0,0,0,0.4)] `}>
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
          </CardContent>
          <CardFooter className="flex w-full justify-end">
              <Button type="button" >Add Field</Button>
          </CardFooter>
        </Card>
      </div>
    )
}