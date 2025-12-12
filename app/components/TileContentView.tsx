import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import type { TileData } from "./TileConfiguration";

interface TileContentViewerProps {
  tiles: TileData[];
  compact?: boolean;
}

export default function TileContentViewer({
  tiles,
  compact = false,
}: TileContentViewerProps) {
  const [expandedTiles, setExpandedTiles] = useState<Set<string>>(new Set());

  const getTileIcon = (type: TileData["type"]) => {
    switch (type) {
      case "text":
        return <FileText className="h-4 w-4" />;
      case "links":
        return <LinkIcon className="h-4 w-4" />;
      case "table":
        return <Database className="h-4 w-4" />;
      case "images":
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: TileData["type"]) => {
    switch (type) {
      case "text":
        return "Text";
      case "links":
        return "Links";
      case "table":
        return "Table";
      case "images":
        return "Images";
    }
  };

  const getContentSummary = (tile: TileData) => {
    switch (tile.type) {
      case "text":
        const text = tile.content || "";
        return text.length > 50 ? `${text.substring(0, 50)}...` : text;
      case "links":
        const links = Array.isArray(tile.content) ? tile.content : [];
        return `${links.length} link${links.length !== 1 ? "s" : ""}`;
      case "table":
        return "Table data";
      case "images":
        const images = Array.isArray(tile.content) ? tile.content : [];
        return `${images.length} image${images.length !== 1 ? "s" : ""}`;
    }
  };

  const renderFullContent = (tile: TileData) => {
    switch (tile.type) {
      case "text":
        return (
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-sm whitespace-pre-wrap">
              {tile.content || <span className="text-muted-foreground italic">No content</span>}
            </p>
          </div>
        );

      case "links":
        const links = Array.isArray(tile.content) ? tile.content : [];
        if (links.length === 0) {
          return (
            <p className="text-sm text-muted-foreground italic">No links</p>
          );
        }
        return (
          <div className="space-y-2">
            {links.map((link: { label: string; url: string }, idx: number) => (
              <Card key={idx} className="bg-muted/30">
                <CardContent className=" flex items-center justify-between">
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
        if (!tile.content?.headers || !tile.content?.data) {
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
                    {tile.content.headers.map((header: string, i: number) => (
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
                  {tile.content.data.map((row: any[], i: number) => (
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
        const images = Array.isArray(tile.content) ? tile.content : [];
        if (images.length === 0) {
          return (
            <p className="text-sm text-muted-foreground italic">No images</p>
          );
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
    }
  };

  if (compact) {
    // Compact view - just show counts and basic info
    return (
      <div className="flex flex-wrap gap-2">
        {tiles.map((tile) => (
          <Badge
            key={tile.id}
            variant="outline"
            className="flex items-center gap-1.5 px-2 py-1"
          >
            {getTileIcon(tile.type)}
            <span className="text-xs">{tile.title}</span>
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

  // Full view with expandable content
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
                {getTileIcon(tile.type)}
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
                    {getTypeLabel(tile.type)}
                  </Badge>
                  <span>{getContentSummary(tile)}</span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">{renderFullContent(tile)}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}