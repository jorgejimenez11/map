interface MindMapData {
  id: string
  title: string
  nodes: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    text: string
    color: string
    shape: "rectangle" | "circle"
  }>
  connections: Array<{
    id: string
    fromNodeId: string
    toNodeId: string
  }>
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "mindmapper_maps"
const CURRENT_MAP_KEY = "mindmapper_current_map"

export const storage = {
  // Save a mind map to localStorage
  saveMindMap: (data: Omit<MindMapData, "id" | "createdAt" | "updatedAt">) => {
    try {
      const maps = storage.getAllMindMaps()
      const now = new Date().toISOString()

      const mindMap: MindMapData = {
        ...data,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      }

      maps.push(mindMap)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(maps))
      localStorage.setItem(CURRENT_MAP_KEY, mindMap.id)

      return mindMap
    } catch (error) {
      console.error("Error saving mind map:", error)
      throw new Error("No se pudo guardar el mapa mental")
    }
  },

  // Update an existing mind map
  updateMindMap: (id: string, data: Partial<Omit<MindMapData, "id" | "createdAt">>) => {
    try {
      const maps = storage.getAllMindMaps()
      const mapIndex = maps.findIndex((map) => map.id === id)

      if (mapIndex === -1) {
        throw new Error("Mapa mental no encontrado")
      }

      maps[mapIndex] = {
        ...maps[mapIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(maps))
      return maps[mapIndex]
    } catch (error) {
      console.error("Error updating mind map:", error)
      throw new Error("No se pudo actualizar el mapa mental")
    }
  },

  // Get all saved mind maps
  getAllMindMaps: (): MindMapData[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading mind maps:", error)
      return []
    }
  },

  // Get a specific mind map by ID
  getMindMap: (id: string): MindMapData | null => {
    try {
      const maps = storage.getAllMindMaps()
      return maps.find((map) => map.id === id) || null
    } catch (error) {
      console.error("Error loading mind map:", error)
      return null
    }
  },

  // Delete a mind map
  deleteMindMap: (id: string) => {
    try {
      const maps = storage.getAllMindMaps()
      const filteredMaps = maps.filter((map) => map.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMaps))

      // Clear current map if it was deleted
      const currentMapId = localStorage.getItem(CURRENT_MAP_KEY)
      if (currentMapId === id) {
        localStorage.removeItem(CURRENT_MAP_KEY)
      }
    } catch (error) {
      console.error("Error deleting mind map:", error)
      throw new Error("No se pudo eliminar el mapa mental")
    }
  },

  // Get current map ID
  getCurrentMapId: (): string | null => {
    return localStorage.getItem(CURRENT_MAP_KEY)
  },

  // Set current map ID
  setCurrentMapId: (id: string) => {
    localStorage.setItem(CURRENT_MAP_KEY, id)
  },

  // Generate shareable link (base64 encoded data)
  generateShareableLink: (data: Omit<MindMapData, "id" | "createdAt" | "updatedAt">): string => {
    try {
      const shareData = {
        ...data,
        sharedAt: new Date().toISOString(),
      }
      const encoded = btoa(JSON.stringify(shareData))
      return `${window.location.origin}/shared/${encoded}`
    } catch (error) {
      console.error("Error generating shareable link:", error)
      throw new Error("No se pudo generar el enlace para compartir")
    }
  },

  // Decode shared mind map data
  decodeSharedData: (encoded: string): Omit<MindMapData, "id" | "createdAt" | "updatedAt"> | null => {
    try {
      const decoded = atob(encoded)
      return JSON.parse(decoded)
    } catch (error) {
      console.error("Error decoding shared data:", error)
      return null
    }
  },
}
