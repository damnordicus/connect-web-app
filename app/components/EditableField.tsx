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
  originalValue,
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
  originalValue: string;
}) => {
  const hasChanged = field !== originalValue;
  console.log('field: ', field, hasChanged)

  const handleSave = () => {
    setFieldEdit(false);
  };

  const handleCancel = () => {
    setField(originalValue);
    setFieldEdit(false);
  };

  return (
    <div>
      <div className="flex justify-between">
        <div className="flex gap-2 mb-2">
          <Icon className="h-4 w-4" />
          <Label>{label}</Label>
        </div>
        <div>
          {fieldEdit && (
            <div className="flex gap-2">
              <button type="button" onClick={handleSave}>
                <Save className="w-4 h-4 hover:bg-gray-200 hover:rounded" />
              </button>
              <button type="button" onClick={handleCancel}>
                <X className="w-4 h-4 hover:bg-gray-200 hover:rounded" />
              </button>
            </div>
          )}
          {!fieldEdit && !disabled && (
            <button type="button" onClick={() => setFieldEdit(true)}>
              <Edit2 className="w-4 h-4 hover:bg-gray-200 hover:rounded" />
            </button>
          )}
        </div>
      </div>
      {!fieldEdit && (
        <p className={`bg-background/20 p-2 border ${hasChanged ? 'border-yellow-400' : 'border-border'} rounded-lg text-sm font-medium ${!field ? 'text-gray-400 italic' : 'text-foreground'}`}>{!field ? 'N/A' : field}</p>
      )}
      {fieldEdit && (!type || type === "text") && (
        <input
          type="text"
          className={`w-full p-2 font-medium text-sm border rounded-lg`}
          value={field}
          onChange={(e) => setField(e.currentTarget.value)}
          disabled={disabled}
        />
      )}
      {fieldEdit && type === "textarea" && (
        <textarea
          className="w-full p-2 font-medium text-sm border rounded-lg"
          value={field}
          onChange={(e) => setField(e.currentTarget.value)}
          disabled={disabled}
        />
      )}
      {/* Hidden input that only renders if the value has changed */}
      {hasChanged && (
        <input type="hidden" name={name} value={field} />
      )}
    </div>
  );
};