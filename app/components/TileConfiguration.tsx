import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
  MoveUp,
  MoveDown,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";

export interface TileContentSection {
  id: string;
  type: "table" | "links" | "images" | "text";
  content: any;
  label?: string; // Optional label for each section
}

export interface TileData {
  id: string;
  title: string;
  color: string;
  visible: boolean;
  sections: TileContentSection[]; // Array of different content types
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
    color: "bg-sky-600/20",
    visible: true,
    sections: [],
  });

  const handleAddTile = () => {
    const tile: TileData = {
      id: Date.now().toString(),
      title: newTile.title || "New Tile",
      color: newTile.color || "bg-sky-600/20",
      visible: true,
      sections: newTile.sections || [],
    };

    setTiles([...tiles, tile]);
    setNewTile({
      title: "",
      color: "bg-sky-600/20",
      visible: true,
      sections: [],
    });
    setShowAddModal(false);
  };

  const handleEditTile = (tile: TileData) => {
    setEditingTile(JSON.parse(JSON.stringify(tile))); // Deep clone
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

  const getDefaultContent = (type: TileContentSection["type"]) => {
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

  const addSection = (
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>,
    type: TileContentSection["type"]
  ) => {
    const newSection: TileContentSection = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      label: "",
    };

    setTileData(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
  };

  const updateSection = (
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>,
    sectionId: string,
    updates: Partial<TileContentSection>
  ) => {
    setTileData(prev => ({
      ...prev,
      sections: (prev.sections || []).map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  };

  const deleteSection = (
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>,
    sectionId: string
  ) => {
    setTileData(prev => ({
      ...prev,
      sections: (prev.sections || []).filter(section => section.id !== sectionId),
    }));
  };

  const moveSectionUp = (
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>,
    index: number
  ) => {
    if (index === 0) return;
    setTileData(prev => {
      const sections = [...(prev.sections || [])];
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
      return { ...prev, sections };
    });
  };

  const moveSectionDown = (
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>,
    index: number
  ) => {
    if (index === (tile.sections?.length || 0) - 1) return;
    setTileData(prev => {
      const sections = [...(prev.sections || [])];
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      return { ...prev, sections };
    });
  };

  const renderSectionEditor = (
    section: TileContentSection,
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>,
    index: number
  ) => {
    const sectionType = TILE_TYPES.find(t => t.value === section.type);
    const SectionIcon = sectionType?.icon || FileText;

    return (
      <Card key={section.id} className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => moveSectionUp(tile, setTileData, index)}
              disabled={index === 0}
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => moveSectionDown(tile, setTileData, index)}
              disabled={index === (tile.sections?.length || 0) - 1}
            >
              <MoveDown className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SectionIcon className="h-4 w-4" />
                <Badge variant="outline">{sectionType?.label}</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => deleteSection(tile, setTileData, section.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Section Label (Optional)</Label>
              <Input
                placeholder="e.g., 'Contact Information', 'Hours'"
                value={section.label || ""}
                onChange={(e) =>
                  updateSection(tile, setTileData, section.id, { label: e.target.value })
                }
              />
            </div>

            {renderContentEditor(section, tile, setTileData)}
          </div>
        </div>
      </Card>
    );
  };

  const renderContentEditor = (
    section: TileContentSection,
    tile: Partial<TileData>,
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>
  ) => {
    switch (section.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Label>Text Content</Label>
            <textarea
              className="w-full border rounded-md p-2 min-h-[100px] bg-input/30"
              value={section.content || ""}
              onChange={(e) =>
                updateSection(tile, setTileData, section.id, { content: e.target.value })
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
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  const links = section.content || [];
                  updateSection(tile, setTileData, section.id, {
                    content: [...links, { label: "", url: "" }],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {(section.content || []).map((link: any, linkIndex: number) => (
                <Card key={linkIndex} className="p-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const links = [...section.content];
                        links[linkIndex].label = e.target.value;
                        updateSection(tile, setTileData, section.id, { content: links });
                      }}
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => {
                        const links = [...section.content];
                        links[linkIndex].url = e.target.value;
                        updateSection(tile, setTileData, section.id, { content: links });
                      }}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => {
                        const links = section.content.filter(
                          (_: any, i: number) => i !== linkIndex
                        );
                        updateSection(tile, setTileData, section.id, { content: links });
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
              Table data will use the existing table configuration from the Tables section.
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
                const images = section.content || [];
                updateSection(tile, setTileData, section.id, { content: [...images, ""] });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Image
            </Button>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(section.content || []).map((url: string, imgIndex: number) => (
                <div key={imgIndex} className="flex gap-2">
                  <Input
                    placeholder="Image URL"
                    value={url}
                    onChange={(e) => {
                      const images = [...section.content];
                      images[imgIndex] = e.target.value;
                      updateSection(tile, setTileData, section.id, { content: images });
                    }}
                  />
                  <Button
                    size="sm"
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const images = section.content.filter(
                        (_: any, i: number) => i !== imgIndex
                      );
                      updateSection(tile, setTileData, section.id, { content: images });
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
            className={`${!tile.visible ? "opacity-50" : ""} rounded-lg bg-input/20`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <Checkbox
                  checked={tile.visible}
                  onCheckedChange={() => handleToggleVisibility(tile.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tile.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {tile.sections.length} section{tile.sections.length !== 1 ? 's' : ''}
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-card">
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

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Content Sections</Label>
                <Select
                  onValueChange={(value) =>
                    addSection(newTile, setNewTile, value as TileContentSection["type"])
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add section..." />
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

              {newTile.sections && newTile.sections.length > 0 ? (
                <div className="space-y-3">
                  {newTile.sections.map((section, index) =>
                    renderSectionEditor(section, newTile, setNewTile, index)
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sections added yet. Use the dropdown above to add content sections.
                </p>
              )}
            </div>
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
      <Dialog open={showEditModal} onOpenChange={setShowEditModal} >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-card">
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

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Content Sections</Label>
                  <Select
                    onValueChange={(value) =>
                      addSection(editingTile, setEditingTile, value as TileContentSection["type"])
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Add section..." />
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

                {editingTile.sections && editingTile.sections.length > 0 ? (
                  <div className="space-y-3">
                    {editingTile.sections.map((section, index) =>
                      renderSectionEditor(section, editingTile, setEditingTile, index)
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sections added yet. Use the dropdown above to add content sections.
                  </p>
                )}
              </div>
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