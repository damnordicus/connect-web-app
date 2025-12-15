import type { TileData, TileContentSection } from "~/components/TileConfiguration";

// Type for old tile structure (before multi-section update)
export interface OldTileData {
  id: string;
  title: string;
  type: "table" | "links" | "images" | "text";
  color: string;
  visible: boolean;
  content: any;
}

/**
 * Migrates tiles from the old single-type format to the new multi-section format
 * 
 * @param oldTiles - Array of tiles in the old format
 * @returns Array of tiles in the new format
 */
export function migrateTilesToSections(oldTiles: OldTileData[]): TileData[] {
  return oldTiles.map(oldTile => ({
    id: oldTile.id,
    title: oldTile.title,
    color: oldTile.color,
    visible: oldTile.visible,
    sections: [{
      id: `${oldTile.id}-section-1`,
      type: oldTile.type,
      content: oldTile.content,
      label: undefined
    }]
  }));
}

/**
 * Checks if tiles are in the old format
 * 
 * @param tiles - Array of tiles to check
 * @returns true if tiles are in old format, false otherwise
 */
export function isOldTileFormat(tiles: any[]): tiles is OldTileData[] {
  if (!tiles || tiles.length === 0) return false;
  return 'type' in tiles[0] && 'content' in tiles[0] && !('sections' in tiles[0]);
}

/**
 * Safely loads tiles, automatically migrating if necessary
 * 
 * @param tilesConfig - Tiles config from database (could be old or new format)
 * @param defaultTiles - Default tiles to use if no config exists
 * @returns Tiles in the new format
 */
export function loadTiles(
  tilesConfig: any[] | null | undefined,
  defaultTiles: TileData[] = []
): TileData[] {
  // No tiles config - return defaults
  if (!tilesConfig || tilesConfig.length === 0) {
    return defaultTiles;
  }

  // Check if old format and migrate
  if (isOldTileFormat(tilesConfig)) {
    console.log('Migrating tiles from old format to new multi-section format');
    return migrateTilesToSections(tilesConfig);
  }

  // Already new format
  return tilesConfig as TileData[];
}

/**
 * Creates a default tile with multiple sections
 * Useful for initializing new tiles
 */
export function createDefaultTile(
  title: string,
  sections: Omit<TileContentSection, 'id'>[],
  color: string = "bg-sky-600/20"
): TileData {
  const baseId = Date.now().toString();
  
  return {
    id: baseId,
    title,
    color,
    visible: true,
    sections: sections.map((section, index) => ({
      id: `${baseId}-section-${index + 1}`,
      ...section
    }))
  };
}

/**
 * Example helper for creating common tile types
 */
export const TileTemplates = {
  /**
   * Creates a contact information tile with text and links
   */
  contactInfo: (phone?: string, email?: string, description?: string): TileData => {
    return createDefaultTile(
      "Contact Information",
      [
        {
          type: "text",
          content: description || "Contact us for assistance",
          label: "Information"
        },
        {
          type: "links",
          content: [
            ...(phone ? [{ label: "Phone", url: `tel:${phone}` }] : []),
            ...(email ? [{ label: "Email", url: `mailto:${email}` }] : [])
          ],
          label: "Contact Methods"
        }
      ],
      "bg-blue-600/20"
    );
  },

  /**
   * Creates an emergency contact tile with multiple sections
   */
  emergencyContact: (): TileData => {
    return createDefaultTile(
      "Emergency Contact",
      [
        {
          type: "text",
          content: "In case of emergency, use these resources immediately.",
          label: "Notice"
        },
        {
          type: "links",
          content: [
            { label: "Emergency Line", url: "tel:911" },
            { label: "Base Security", url: "tel:555-0100" }
          ],
          label: "Emergency Numbers"
        }
      ],
      "bg-red-600/20"
    );
  },

  /**
   * Creates a basic text-only tile
   */
  textOnly: (title: string, content: string, color?: string): TileData => {
    return createDefaultTile(
      title,
      [{
        type: "text",
        content,
        label: undefined
      }],
      color
    );
  },

  /**
   * Creates a links-only tile
   */
  linksOnly: (title: string, links: Array<{ label: string; url: string }>, color?: string): TileData => {
    return createDefaultTile(
      title,
      [{
        type: "links",
        content: links,
        label: undefined
      }],
      color
    );
  }
};