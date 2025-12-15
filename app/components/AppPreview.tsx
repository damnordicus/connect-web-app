import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import type { TileData, TileContentSection } from "./TileConfiguration";
import { Database, Image as ImageIcon, Link as LinkIcon, FileText } from "lucide-react";

interface AppPreviewProps {
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerImage?: string;
  tiles: TileData[];
  showLogo?: boolean;
  showType?: boolean;
  orgType?: string;
}

export default function AppPreview({
  showHeader = true,
  headerTitle,
  headerSubtitle,
  headerImage,
  tiles,
  showLogo,
  showType,
  orgType,
}: AppPreviewProps) {
  const visibleTiles = tiles.filter((tile) => tile.visible);

  const getTileIcon = (sections: TileContentSection[]) => {
    // Show icon for first section type, or a generic icon if no sections
    if (sections.length === 0) return <FileText className="h-5 w-5" />;
    
    const firstType = sections[0].type;
    switch (firstType) {
      case "text":
        return <FileText className="h-5 w-5" />;
      case "links":
        return <LinkIcon className="h-5 w-5" />;
      case "table":
        return <Database className="h-5 w-5" />;
      case "images":
        return <ImageIcon className="h-5 w-5" />;
    }
  };

  const getTileContentPreview = (tile: TileData) => {
    if (tile.sections.length === 0) {
      return <p className="text-xs text-muted-foreground">No content</p>;
    }

    // Show count of each content type
    const typeCounts = tile.sections.reduce((acc, section) => {
      acc[section.type] = (acc[section.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="text-xs text-muted-foreground">
        {Object.entries(typeCounts).map(([type, count], index) => (
          <span key={type}>
            {count} {type}{count > 1 ? 's' : ''}
            {index < Object.keys(typeCounts).length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Phone Frame */}
      <div className="border-8 border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white dark:bg-gray-900">
        {/* Status Bar */}
        <div className="bg-gray-800 h-6 flex items-center justify-between px-6 text-white text-xs">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 border border-white rounded-sm" />
            <div className="w-4 h-3 border border-white rounded-sm" />
            <div className="w-4 h-3 border border-white rounded-sm" />
          </div>
        </div>

        {/* App Content */}
        <div className="bg-gray-100 dark:bg-gray-950 min-h-[600px] p-4 space-y-4">
          {/* Header Card */}
          {showHeader && (
            <Card className="overflow-hidden">
              <div className="relative">
                {headerImage ? (
                  <div className="relative h-[180px]">
                    <img
                      src={headerImage}
                      alt="Header"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 text-white">
                      <h2 className="text-lg font-bold">{headerTitle}</h2>
                      {headerSubtitle && (
                        <p className="text-sm opacity-90">{headerSubtitle}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <CardContent className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                      {showLogo && headerImage && (
                        <img
                          src={headerImage}
                          alt="Logo"
                          className="w-12 h-12 rounded-full bg-white p-1"
                        />
                      )}
                      <div className="flex-1">
                        <h2 className="text-lg font-bold">{headerTitle}</h2>
                        {headerSubtitle && (
                          <p className="text-sm opacity-90">{headerSubtitle}</p>
                        )}
                        {showType && orgType && (
                          <Badge className="mt-1 bg-white/20 text-white border-white/40">
                            {orgType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </div>
            </Card>
          )}

          {/* Tiles Grid */}
          <div className="grid grid-cols-2 gap-3">
            {visibleTiles.map((tile) => {
              const color = tile.color.split("-")
              const baseColor = color[1]
              const borderColor = 'border-' + baseColor + '-300'
              return(
              <Card
                key={tile.id}
                className={`${tile.color} border-2 ${borderColor} rounded-lg hover:shadow-md transition-shadow cursor-pointer`}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-[120px]">
                  <div className="mb-2 opacity-70">{getTileIcon(tile.sections)}</div>
                  <h3 className="font-semibold text-sm mb-1">{tile.title}</h3>
                  {getTileContentPreview(tile)}
                  {tile.sections.length > 1 && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {tile.sections.length} items
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )})}
          </div>

          {/* Empty State */}
          {visibleTiles.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No visible tiles</p>
                <p className="text-xs mt-1">Add tiles to see them here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Device Label */}
      <p className="text-center text-xs text-muted-foreground mt-3">
        Mobile App Preview
      </p>
    </div>
  );
}