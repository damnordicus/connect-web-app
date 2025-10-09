import { Form } from "react-router";
import { Label } from "./ui/label";
import { Edit2, Save, X } from "lucide-react";
import { useState } from "react";

export const EditableField = ({
  label,
  name,
  field,
  setField,
  Icon,
  fieldEdit,
  setFieldEdit,
  type,
  disabled,
}: {
  label: string;
  name: string;
  field: string;
  setField: any;
  Icon: any;
  fieldEdit: boolean;
  setFieldEdit: any;
  type?: string;
  disabled: boolean;
}) => {

  const [temp, setTemp] = useState(field);

  return (
    <div>
      {/* <Form method="POST"> */}
        <div className="flex justify-between">
          <div className="flex gap-2 mb-2">
            <Icon className="h-4 w-4" />
            <Label>{label}</Label>
          </div>
          <div>
            {fieldEdit && (
              <div className="flex gap-2">
                <button type="button" value={`${name}-submit`} name="submit" onClick={() => setField(temp)}>
                  <Save className="w-4 h-4 hover:bg-gray-200 hover:rounded" />
                </button>
                <X
                  onClick={() => setFieldEdit(false)}
                  className="w-4 h-4 hover:bg-gray-200 hover:rounded"
                />
              </div>
            )}
            {!fieldEdit && !disabled && (
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
        {fieldEdit && (!type || type === "text") && (
          <input
            type="text"
            name={name}
            className="w-full p-2 font-medium text-sm border rounded-lg"
            value={temp}
            onChange={(e) => setTemp(e.currentTarget.value)}
            disabled={disabled}
          />
        )}
        {fieldEdit && type === "textarea" && (
          <textarea
            name={name}
            className="w-full p-2 font-medium text-sm border rounded-lg"
            value={temp}
            onChange={(e) => setTemp(e.currentTarget.value)}
            disabled={disabled}
          />
        )}
        <input type="hidden" name={name} value={temp} />
      {/* </Form> */}
    </div>
  );
};
