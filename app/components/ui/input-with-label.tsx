import type { SetStateAction } from "react";
import type React from "react";

export default function InputWithLabel ({label, name, type, value, setter}: {label: string, name: string, type:string, value: string, setter: React.Dispatch<SetStateAction<string>>}) {
    return (
        <div className="text-left space-y-2 my-4">
          <p>{`${label}: `}</p>
          {type === "textarea" && <textarea className="border rounded-md p-1 w-full" name="description" onChange={(e) => {setter(e.currentTarget.value)}} value={value}></textarea> }
          {type !== "textarea" && <input type={type} name={name} onChange={(e) => {setter(e.currentTarget.value)}} className="border rounded-md p-1 w-full" value={value} />}
        </div>
    );
}