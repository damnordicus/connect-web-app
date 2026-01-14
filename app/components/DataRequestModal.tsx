import { Form } from "react-router";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Building, FileUp, Folder, Database } from "lucide-react";
import { EditableField } from "./EditableField";
import { useState } from "react";
import { Button } from "./ui/button";
import TileContentViewer from "./TileContentView";

// Fields to exclude from the standard field display
const EXCLUDED_FIELDS = [
  "submit",
  "userId",
  "baseId",
  "orgId",
  "request-type",
  "documents",
  "folderPath",
  "description",
  "tiles_config"
];

export default function DataRequestModal({ requestData, existingData }) {
  const [name, setName] = useState(requestData.organization?.name || "");
  const [nameEdit, setNameEdit] = useState(false);

  const hasDocuments = requestData.data.documents;
  const documentCount = hasDocuments ? hasDocuments.count : 0;
  const hasTiles = requestData.data.tiles_config;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <Card className="w-1/4 md:w-3/4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <p className="text-2xl">{requestData.organization?.name || "Request Details"}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form method="POST" encType="multipart/form-data">
            {/* Standard fields */}
            {Object.entries(requestData.data).map(
              ([key, value]: [string, any]) => {
                if (!EXCLUDED_FIELDS.includes(key)) {
                  return (
                    <EditableField
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1) + ":"}
                      name={key}
                      field={value}
                      setField={setName}
                      Icon={Building}
                      fieldEdit={nameEdit}
                      setFieldEdit={undefined}
                      disabled={false}
                    />
                  );
                }
                return null;
              }
            )}

            {/* Tile configuration section */}
            {hasTiles && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">App Tiles Configuration</p>
                </div>
                <TileContentViewer
                  tiles={JSON.parse(hasTiles)}
                  compact={false}
                />
              </div>
            )}

            {/* Document uploads section */}
            {hasDocuments && documentCount > 0 && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileUp className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">Document Uploads</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Folder:</span>
                    <code className="text-xs bg-background px-2 py-0.5 rounded">
                      {requestData.data.folderPath || "/"}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Files:</span>
                    <span>{documentCount} document{documentCount !== 1 ? "s" : ""}</span>
                  </div>
                  {requestData.data.description && (
                    <div className="text-sm pt-2 border-t mt-2">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="mt-1">{requestData.data.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-6 gap-2">
              <Button type="submit" name="_action" value="approve" className="text-center bg-green-500 hover:bg-green-600">
                Approve Changes
              </Button>
              <Button type="submit" name="_action" value="deny" className="text-center bg-red-500 hover:bg-red-600">
                Deny Changes
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
