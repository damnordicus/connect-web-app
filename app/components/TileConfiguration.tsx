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
  Building,
  X,
  FolderOpen,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";

export interface TileContentSection {
  id: string;
  type: "table" | "links" | "images" | "text" | "baseData" | "documents";
  content: any;
  label?: string;
}

export interface TileData {
  id: string;
  title: string;
  color: string;
  visible: boolean;
  sections: TileContentSection[];
}

export interface BaseDataField {
  key: string;
  label: string;
  value: any;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TileConfigurationProps {
  tiles: TileData[];
  setTiles: React.Dispatch<React.SetStateAction<TileData[]>>;
  entityType: "base" | "org";
  baseData?: BaseDataField[]; // Available base data fields
  tables?: [];
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
  { value: "baseData", label: "Base Data Fields", icon: Building },
  { value: "documents", label: "Document Library", icon: FolderOpen },
];

export default function TileConfiguration({
  tiles,
  setTiles,
  entityType,
  baseData = [],
  tables = [],
}: TileConfigurationProps) {
  // console.log(baseData)
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
    setEditingTile(JSON.parse(JSON.stringify(tile)));
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
      case "baseData":
        return []; // Array of selected field keys
      case "documents":
        return { folder: "/", maxFiles: 5, showRecent: true };
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

  // Base Data Field Selection Component
  const BaseDataSelector = ({
    section,
    tile,
    setTileData,
  }: {
    section: TileContentSection;
    tile: Partial<TileData>;
    setTileData: React.Dispatch<React.SetStateAction<Partial<TileData>>>;
  }) => {
    const selectedKeys = section.content || [];
    
    const toggleField = (key: string) => {
      const newContent = selectedKeys.includes(key)
        ? selectedKeys.filter((k: string) => k !== key)
        : [...selectedKeys, key];
      updateSection(tile, setTileData, section.id, { content: newContent });
    };

    const moveFieldUp = (index: number) => {
      if (index === 0) return;
      const newContent = [...selectedKeys];
      [newContent[index - 1], newContent[index]] = [newContent[index], newContent[index - 1]];
      updateSection(tile, setTileData, section.id, { content: newContent });
    };

    const moveFieldDown = (index: number) => {
      if (index === selectedKeys.length - 1) return;
      const newContent = [...selectedKeys];
      [newContent[index], newContent[index + 1]] = [newContent[index + 1], newContent[index]];
      updateSection(tile, setTileData, section.id, { content: newContent });
    };

    const removeField = (key: string) => {
      const newContent = selectedKeys.filter((k: string) => k !== key);
      updateSection(tile, setTileData, section.id, { content: newContent });
    };

    return (
      <div className="space-y-4">
        {/* Selected Fields */}
        {selectedKeys.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Fields (in order)</Label>
            <div className="border rounded-lg divide-y">
              {selectedKeys.map((key: string, index: number) => {
                const field = baseData.find(f => f.key === key);
                if (!field) return null;
                
                return (
                  <div key={key} className="flex items-center gap-2 p-3 bg-muted/30">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => moveFieldUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => moveFieldDown(index)}
                        disabled={index === selectedKeys.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{field.value || 'N/A'}</p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => removeField(key)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Fields */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Available Base Fields</Label>
          <div className="border rounded-lg max-h-[300px] overflow-y-auto">
            {baseData.map((field) => {
              const isSelected = selectedKeys.includes(field.key);
              const FieldIcon = field.icon || Building;
              
              return (
                <div
                  key={field.key}
                  className={`flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-primary/10' : ''
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleField(field.key)}
                  />
                  <FieldIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {field.value || 'No data'}
                    </p>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">
                      #{selectedKeys.indexOf(field.key) + 1}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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
      case "baseData":
        return <BaseDataSelector section={section} tile={tile} setTileData={setTileData} />;

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
        const selectedTableIds: string[] = Array.isArray(section.content) 
          ? section.content 
          : [];
        const availableTables = tables?.filter(t => !selectedTableIds.includes(t.id)) || [];
        
        return (
          <div className="space-y-4">
            <Label>Table Configuration</Label>
            <Select 
              onValueChange={(tableId) => {
                updateSection(tile, setTileData, section.id, { 
                  content: [...selectedTableIds, tableId]
                });
              }}
              value=""
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  availableTables.length > 0 
                    ? "Select a table to add" 
                    : "All tables selected"
                }/>
              </SelectTrigger>
              <SelectContent>
                {availableTables.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t?.title || "Untitled Table"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTableIds.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Selected Tables ({selectedTableIds.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTableIds.map((tableId) => {
                    const table = tables?.find(t => t.id === tableId);
                    return (
                      <Badge 
                        key={tableId} 
                        variant="secondary" 
                        className="flex items-center gap-2 p-2 border"
                      >
                        {table?.title || "Untitled Table"}
                        <button
                          type="button"
                          onClick={() => {
                            updateSection(tile, setTileData, section.id, { 
                              content: selectedTableIds.filter(id => id !== tableId)
                            });
                          }}
                          className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
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

      case "documents":
        return (
          <div className="space-y-4">
            <Label>Document Display Settings</Label>
            <p className="text-sm text-muted-foreground">
              Configure how documents appear in the tile
            </p>
            <div className="space-y-2">
              <Label className="text-sm">Folder to Display</Label>
              <Input
                placeholder="Folder path (e.g., /Policies)"
                value={section.content?.folder || "/"}
                onChange={(e) =>
                  updateSection(tile, setTileData, section.id, {
                    content: { ...section.content, folder: e.target.value }
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave as "/" to show all documents
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Max Files to Show</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={section.content?.maxFiles || 5}
                onChange={(e) =>
                  updateSection(tile, setTileData, section.id, {
                    content: { ...section.content, maxFiles: parseInt(e.target.value) || 5 }
                  })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={section.content?.showRecent ?? true}
                onCheckedChange={(checked) =>
                  updateSection(tile, setTileData, section.id, {
                    content: { ...section.content, showRecent: checked }
                  })
                }
              />
              <Label className="text-sm">Show most recent files</Label>
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