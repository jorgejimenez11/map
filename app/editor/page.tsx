"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { MindMapCanvas } from "@/components/mind-map-canvas"
import { Toolbar } from "@/components/toolbar"
import { FileText, Save, Download, Share2, Undo, Redo, Copy, Check } from "lucide-react"
import Link from "next/link"
import { storage } from "@/lib/storage"

interface Node {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  color: string
  shape: "rectangle" | "circle"
}

interface Connection {
  id: string
  fromNodeId: string
  toNodeId: string
}

export default function EditorPage() {
  const canvasRef = useRef<{
    exportToPNG: () => void
    exportToPDF: () => void
    getCurrentData: () => { nodes: Node[]; connections: Connection[] }
    loadData: (data: { nodes: Node[]; connections: Connection[] }) => void
  } | null>(null)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [currentMapId, setCurrentMapId] = useState<string | null>(null)
  const [mapTitle, setMapTitle] = useState("Mapa Mental Sin Título")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])

  useEffect(() => {
    // Load existing map if available
    const savedMapId = storage.getCurrentMapId()
    if (savedMapId) {
      const savedMap = storage.getMindMap(savedMapId)
      if (savedMap) {
        setCurrentMapId(savedMapId)
        setMapTitle(savedMap.title)
        canvasRef.current?.loadData({
          nodes: savedMap.nodes,
          connections: savedMap.connections,
        })
      }
    }
  }, [])

  const handleDataChange = useCallback((newNodes: Node[], newConnections: Connection[]) => {
    setNodes(newNodes)
    setConnections(newConnections)
  }, [])

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return

    setIsSaving(true)
    try {
      const data = canvasRef.current.getCurrentData()

      if (currentMapId) {
        // Update existing map
        storage.updateMindMap(currentMapId, {
          title: mapTitle,
          nodes: data.nodes,
          connections: data.connections,
        })
      } else {
        // Create new map
        const newMap = storage.saveMindMap({
          title: mapTitle,
          nodes: data.nodes,
          connections: data.connections,
        })
        setCurrentMapId(newMap.id)
      }

      // Show success feedback
      const button = document.querySelector("[data-save-button]") as HTMLElement
      if (button) {
        button.style.backgroundColor = "rgb(34 197 94)"
        setTimeout(() => {
          button.style.backgroundColor = ""
        }, 1000)
      }
    } catch (error) {
      alert("Error al guardar el mapa mental")
    } finally {
      setIsSaving(false)
    }
  }, [currentMapId, mapTitle])

  const handleExportPNG = useCallback(() => {
    canvasRef.current?.exportToPNG()
  }, [])

  const handleExportPDF = useCallback(() => {
    canvasRef.current?.exportToPDF()
  }, [])

  const handleShare = useCallback(() => {
    if (!canvasRef.current) return

    try {
      const data = canvasRef.current.getCurrentData()
      const shareableUrl = storage.generateShareableLink({
        title: mapTitle,
        nodes: data.nodes,
        connections: data.connections,
      })

      setShareUrl(shareableUrl)
      setShowShareDialog(true)
    } catch (error) {
      alert("Error al generar enlace para compartir")
    }
  }, [mapTitle])

  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

  const handleTitleSubmit = useCallback(() => {
    setIsEditingTitle(false)
    if (currentMapId) {
      handleSave()
    }
  }, [currentMapId, handleSave])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (nodes.length === 0 && connections.length === 0) return

    const autoSaveInterval = setInterval(() => {
      handleSave()
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [nodes, connections, handleSave])

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold font-work-sans">MindMapper</h1>
            </Link>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center space-x-2">
              {isEditingTitle ? (
                <Input
                  value={mapTitle}
                  onChange={(e) => setMapTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSubmit()
                    if (e.key === "Escape") {
                      setIsEditingTitle(false)
                    }
                  }}
                  className="h-8 w-64"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {mapTitle}
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8"
                data-save-button
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>

              <Button variant="ghost" size="sm" disabled={!canUndo} className="h-8">
                <Undo className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" disabled={!canRedo} className="h-8">
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleShare} className="h-8">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPNG}
              className="h-8"
              title="Exportar como imagen PNG de alta calidad"
            >
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPDF}
              className="h-8"
              title="Exportar como documento PDF"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>

            <div className="h-6 w-px bg-border" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
          <Card className="w-96">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Compartir Mapa Mental</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cualquier persona con este enlace podrá ver tu mapa mental
              </p>

              <div className="flex items-center space-x-2 mb-4">
                <Input value={shareUrl || ""} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyShareUrl}
                  className="flex-shrink-0 bg-transparent"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {copied && <p className="text-sm text-green-600 mb-4">¡Enlace copiado al portapapeles!</p>}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowShareDialog(false)
                    setShareUrl(null)
                    setCopied(false)
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 border-r bg-card/30 flex-shrink-0">
          <Toolbar />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <MindMapCanvas ref={canvasRef} onDataChange={handleDataChange} />
        </div>

        {/* Right Ad Space */}
        <div className="w-64 border-l bg-card/30 flex-shrink-0 p-4">
          <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg h-96 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground text-sm">Espacio Publicitario</p>
            <p className="text-xs text-muted-foreground mt-1">Banner Vertical</p>
            <p className="text-xs text-muted-foreground">300x250</p>
          </div>

          <div className="mt-6 p-3 bg-card/50 rounded-lg border">
            <h4 className="text-sm font-semibold mb-2">Consejos de Exportación</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• PNG: Mejor para compartir en redes</li>
              <li>• PDF: Ideal para documentos</li>
              <li>• Ambos formatos son de alta calidad</li>
              <li>• Se incluye fecha de creación</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-card/50 rounded-lg border">
            <h4 className="text-sm font-semibold mb-2">Guardado Automático</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Se guarda cada 30 segundos</li>
              <li>• Datos almacenados localmente</li>
              <li>• Haz clic en "Guardar" para forzar</li>
              <li>• Comparte con enlaces públicos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
