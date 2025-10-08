import { Form } from "react-router";
import { Label } from "./ui/label";
import { Edit2, Save, X } from "lucide-react";

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
  return (
    <div>
      <Form method="POST">
        <div className="flex justify-between">
          <div className="flex gap-2 mb-2">
            <Icon className="h-4 w-4" />
            <Label>{label}</Label>
          </div>
          <div>
            {fieldEdit && (
              <div className="flex gap-2">
                <button type="submit" value={`${name}-submit`} name="submit">
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
            value={field}
            onChange={(e) => setField(e.currentTarget.value)}
            disabled={disabled}
          />
        )}
        {fieldEdit && type === "textarea" && (
          <textarea
            name={name}
            className="w-full p-2 font-medium text-sm border rounded-lg"
            value={field}
            onChange={(e) => setField(e.currentTarget.value)}
            disabled={disabled}
          />
        )}
      </Form>
    </div>
  );
};
