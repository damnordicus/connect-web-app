import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Database,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
  Building,
  FolderOpen,
  Download,
} from "lucide-react";
import type { TileData, TileContentSection, BaseDataField } from "./TileConfiguration";

interface TileContentViewerProps {
  tiles: TileData[];
  compact?: boolean;
  baseData?: BaseDataField[]; // Pass base data for rendering
}

export default function TileContentViewer({
  tiles,
  compact = false,
  baseData = [],
}: TileContentViewerProps) {
  const getTileIcon = (sections: TileContentSection[]) => {
    if (sections.length === 0) return <FileText className="h-4 w-4" />;

    const firstType = sections[0].type;
    switch (firstType) {
      case "text":
        return <FileText className="h-4 w-4" />;
      case "links":
        return <LinkIcon className="h-4 w-4" />;
      case "table":
        return <Database className="h-4 w-4" />;
      case "images":
        return <ImageIcon className="h-4 w-4" />;
      case "baseData":
        return <Building className="h-4 w-4" />;
      case "documents":
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  const getSectionIcon = (type: TileContentSection["type"]) => {
    switch (type) {
      case "text":
        return <FileText className="h-4 w-4" />;
      case "links":
        return <LinkIcon className="h-4 w-4" />;
      case "table":
        return <Database className="h-4 w-4" />;
      case "images":
        return <ImageIcon className="h-4 w-4" />;
      case "baseData":
        return <Building className="h-4 w-4" />;
      case "documents":
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: TileContentSection["type"]) => {
    switch (type) {
      case "text":
        return "Text";
      case "links":
        return "Links";
      case "table":
        return "Table";
      case "images":
        return "Images";
      case "baseData":
        return "Base Data";
      case "documents":
        return "Documents";
    }
  };

  const getContentSummary = (tile: TileData) => {
    if (tile.sections.length === 0) return "No content";
    
    const typeCounts = tile.sections.reduce((acc, section) => {
      acc[section.type] = (acc[section.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');
  };

  const renderSectionContent = (section: TileContentSection) => {
    switch (section.type) {
      case "baseData":
        const selectedKeys = Array.isArray(section.content) ? section.content : [];
        if (selectedKeys.length === 0) {
          return <p className="text-sm text-muted-foreground italic">No fields selected</p>;
        }
        return (
          <div className="space-y-2">
            {selectedKeys.map((key: string) => {
              const field = baseData.find(f => f.key === key);
              if (!field) return null;
              
              const FieldIcon = field.icon || Building;
              
              return (
                <Card key={key} className="bg-muted/30">
                  <CardContent className="flex items-start gap-3 p-3">
                    <FieldIcon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-sm text-foreground mt-1 break-words">
                        {field.value || <span className="text-muted-foreground italic">No data</span>}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );

      case "text":
        return (
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-sm whitespace-pre-wrap">
              {section.content || <span className="text-muted-foreground italic">No content</span>}
            </p>
          </div>
        );

      case "links":
        const links = Array.isArray(section.content) ? section.content : [];
        if (links.length === 0) {
          return <p className="text-sm text-muted-foreground italic">No links</p>;
        }
        return (
          <div className="space-y-2">
            {links.map((link: { label: string; url: string }, idx: number) => (
              <Card key={idx} className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-2 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "table":
        if (!section.content?.headers || !section.content?.data) {
          return (
            <p className="text-sm text-muted-foreground italic">No table data</p>
          );
        }
        return (
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {section.content.headers.map((header: string, i: number) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-semibold border-r last:border-r-0"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.content.data.map((row: any[], i: number) => (
                    <tr key={i} className="hover:bg-muted/30 border-t">
                      {row.map((cell: any, j: number) => (
                        <td key={j} className="px-3 py-2 border-r last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "images":
        const images = Array.isArray(section.content) ? section.content : [];
        if (images.length === 0) {
          return <p className="text-sm text-muted-foreground italic">No images</p>;
        }
        return (
          <div className="grid grid-cols-2 gap-2">
            {images.map((url: string, idx: number) => (
              <div
                key={idx}
                className="aspect-square bg-muted/30 rounded-md overflow-hidden"
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case "documents":
        const docConfig = section.content || {};
        const folder = docConfig.folder || "/";
        const maxFiles = docConfig.maxFiles || 5;

        return (
          <div className="space-y-2">
            <div className="bg-muted/30 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  {folder === "/" ? "All Documents" : `Folder: ${folder}`}
                </p>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Showing up to {maxFiles} {docConfig.showRecent ? "recent " : ""}documents
              </p>
            </div>
            <Card className="bg-muted/30">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document preview</p>
                    <p className="text-xs text-muted-foreground">
                      Documents will appear here in the app
                    </p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {tiles.map((tile) => (
          <Badge
            key={tile.id}
            variant="outline"
            className="flex items-center gap-1.5 px-2 py-1"
          >
            {getTileIcon(tile.sections)}
            <span className="text-xs">{tile.title}</span>
            {tile.sections.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({tile.sections.length})
              </span>
            )}
            {tile.visible ? (
              <Eye className="h-3 w-3 text-green-600" />
            ) : (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {tiles.map((tile) => (
        <AccordionItem
          key={tile.id}
          value={tile.id}
          className="border rounded-lg bg-muted/20"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1 text-left">
              <div className={`p-2 rounded-md ${tile.color}`}>
                {getTileIcon(tile.sections)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{tile.title}</span>
                  {tile.visible ? (
                    <Badge className="bg-green-600/20 text-green-700 border-green-600/40">
                      Visible
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Hidden
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {tile.sections.length} section{tile.sections.length !== 1 ? 's' : ''}
                  </Badge>
                  <span>{getContentSummary(tile)}</span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2 space-y-4">
              {tile.sections.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No content sections</p>
              ) : (
                tile.sections.map((section, index) => (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getSectionIcon(section.type)}
                      <span className="text-sm font-medium">
                        {section.label || getTypeLabel(section.type)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(section.type)}
                      </Badge>
                    </div>
                    {renderSectionContent(section)}
                    {index < tile.sections.length - 1 && (
                      <div className="border-t my-3" />
                    )}
                  </div>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}