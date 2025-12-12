import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Database,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  XIcon,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";

export interface TileData {
  id: string;
  title: string;
  type: "table" | "links" | "images" | "text";
  color: string;
  visible: boolean;
  content: any; // Will be typed based on type
}

interface TileConfigurationProps {
  tiles: TileData[];
  setTiles: React.Dispatch<React.SetStateAction<TileData[]>>;
  entityType: "base" | "org";
}

const TILE_COLORS = [
  { name: "Sky", value: "bg-sky-600/20" },
  { name: "Rose", value: "bg-rose-600/20" },
  { name: "Emerald", value: "bg-emerald-600/20" },
  { name: "Amber", value: "bg-amber-600/20" },
  { name: "Purple", value: "bg-purple-600/20" },
  { name: "Cyan", value: "bg-cyan-600/20" },
  { name: "Pink", value: "bg-pink-600/20" },
  { name: "Indigo", value: "bg-indigo-600/20" },
];

const TILE_TYPES = [
  { value: "text", label: "Text Content", icon: FileText },
  { value: "links", label: "Links", icon: LinkIcon },
  { value: "table", label: "Table Data", icon: Database },
  { value: "images", label: "Image Gallery", icon: ImageIcon },
];

export default function TileConfiguration({
  tiles,
  setTiles,
  entityType,
}: TileConfigurationProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTile, setEditingTile] = useState<TileData | null>(null);
  const [newTile, setNewTile] = useState<Partial<TileData>>({
    title: "",
    type: "text",
    color: "bg-sky-600/20",
    visible: true,
    content: null,
  });

  const handleAddTile = () => {
    const tile: TileData = {
      id: Date.now().toString(),
      title: newTile.title || "New Tile",
      type: newTile.type as TileData["type"],
      color: newTile.color || "bg-sky-600/20",
      visible: true,
      content: newTile.content !== null && newTile.content !== undefined
        ? newTile.content
        : getDefaultContent(newTile.type as TileData["type"])
    };

    setTiles([...tiles, tile]);
    setNewTile({
      title: "",
      type: "text",
      color: "bg-sky-600/20",
      visible: true,
      content: null,
    });
    setShowAddModal(false);
  };

  const handleEditTile = (tile: TileData) => {
    setEditingTile(tile);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingTile) return;
    setTiles(tiles.map((t) => (t.id === editingTile.id ? editingTile : t)));
    setShowEditModal(false);
    setEditingTile(null);
  };

  const handleDeleteTile = (id: string) => {
    setTiles(tiles.filter((t) => t.id !== id));
  };

  const handleToggleVisibility = (id: string) => {
    setTiles(
      tiles.map((t) => (t.id === id ? { ...t, visible: !t.visible } : t))
    );
  };

  const getDefaultContent = (type: TileData["type"]) => {
    switch (type) {
      case "text":
        return "";
      case "links":
        return [];
      case "table":
        return { headers: [], data: [] };
      case "images":
        return [];
      default:
        return null;
    }
  };

  const renderContentEditor = (
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>
  ) => {
    switch (tile.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Label>Text Content</Label>
            <textarea
              className="w-full border rounded-md p-2 min-h-[100px]"
              value={tile.content || ""}
              onChange={(e) =>
                setTileData(prev => ({ ...prev, content: e.target.value }))
              }
              placeholder="Enter text content..."
            />
          </div>
        );

      case "links":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Links</Label>
              <input type="hidden" name="testa" value="sdsdf"/>
              <Button
                size="sm"
                type="button"
                name="button-test"
                onClick={() => {
                  const links = tile.content || [];
                  setTileData(prev => ({
                    ...prev,
                    content: [...links, { label: "", url: "" }],
                  }));
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {(tile.content || []).map((link: any, index: number) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const links = [...tile.content];
                        links[index].label = e.target.value;
                        setTileData(prev => ({ ...prev, content: links }));
                      }}
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => {
                        const links = [...tile.content];
                        links[index].url = e.target.value;
                        setTileData(prev => ({ ...prev, content: links }));
                      }}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => {
                        const links = tile.content.filter(
                          (_: any, i: number) => i !== index
                        );
                        setTileData(prev => ({ ...prev, content: links }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case "table":
        return (
          <div className="space-y-4">
            <Label>Table Configuration</Label>
            <p className="text-sm text-muted-foreground">
              Table data will use the existing table configuration from the
              Tables section.
            </p>
          </div>
        );

      case "images":
        return (
          <div className="space-y-4">
            <Label>Image URLs</Label>
            <p className="text-sm text-muted-foreground">
              Add image URLs to display in the gallery
            </p>
            <Button
              size="sm"
              type="button"
              onClick={() => {
                const images = tile.content || [];
                setTileData(prev => ({ ...prev, content: [...images, ""] }));
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Image
            </Button>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(tile.content || []).map((url: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Image URL"
                    value={url}
                    onChange={(e) => {
                      const images = [...tile.content];
                      images[index] = e.target.value;
                      setTileData(prev => ({ ...prev, content: images }));
                    }}
                  />
                  <Button
                    size="sm"
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const images = tile.content.filter(
                        (_: any, i: number) => i !== index
                      );
                      setTileData(prev => ({ ...prev, content: images }));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tile List */}
      <div className="space-y-3">
        {tiles.map((tile) => (
          <Card
            key={tile.id}
            className={`${!tile.visible ? "opacity-50" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <Checkbox
                  checked={tile.visible}
                  onCheckedChange={() => handleToggleVisibility(tile.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tile.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {TILE_TYPES.find((t) => t.value === tile.type)?.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => handleEditTile(tile)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => handleDeleteTile(tile.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Tile Button */}
      <Button type="button" onClick={() => setShowAddModal(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Tile
      </Button>

      {/* Add Tile Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Tile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tile Title</Label>
              <Input
                value={newTile.title}
                onChange={(e) =>
                  setNewTile(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter tile title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tile Type</Label>
              <Select
                value={newTile.type}
                onValueChange={(value) =>
                  setNewTile(prev => ({ ...prev, type: value as TileData["type"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TILE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tile Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {TILE_COLORS.map((color) => (
                  <Button
                    key={color.value}
                    size="lg"
                    type="button"
                    onClick={() => setNewTile(prev => ({ ...prev, color: color.value }))}
                    className={`p-4 rounded-lg border-2 ${
                      newTile.color === color.value
                        ? "border-primary"
                        : "border-transparent"
                    } ${color.value}`}
                  >
                    <span className="text-xs font-medium">{color.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {renderContentEditor(newTile, setNewTile)}
          </div>
          <DialogFooter>
            <Button variant={"outline"} type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTile} type="button">Add Tile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tile</DialogTitle>
          </DialogHeader>
          {editingTile && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tile Title</Label>
                <Input
                  value={editingTile.title}
                  onChange={(e) =>
                    setEditingTile({ ...editingTile, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tile Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {TILE_COLORS.map((color) => (
                    <Button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setEditingTile({ ...editingTile, color: color.value })
                      }
                      className={`p-4 rounded-lg border-2 ${
                        editingTile.color === color.value
                          ? "border-primary"
                          : "border-transparent"
                      } ${color.value}`}
                    >
                      <span className="text-xs font-medium">{color.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {renderContentEditor(editingTile, setEditingTile)}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingTile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} type="button">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden input to submit tile data */}
      {tiles.length > 0 && (
        <input
          type="hidden"
          name="tiles_config"
          value={JSON.stringify(tiles)}
        />
      )}
    </div>
  );
}