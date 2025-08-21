"use client"

import { useRef } from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { MindMapCanvas } from "@/components/mind-map-canvas"
import { FileText, Download, Home } from "lucide-react"
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

export default function SharedMapPage() {
  const params = useParams()
  const [mapData, setMapData] = useState<{ title: string; nodes: Node[]; connections: Connection[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<{ exportToPNG: () => void; exportToPDF: () => void } | null>(null)

  useEffect(() => {
    if (params.id) {
      try {
        const decoded = storage.decodeSharedData(params.id as string)
        if (decoded) {
          setMapData(decoded)
        } else {
          setError("Enlace inválido o corrupto")
        }
      } catch (error) {
        setError("Error al cargar el mapa compartido")
      }
    }
  }, [params.id])

  const handleExportPNG = () => {
    canvasRef.current?.exportToPNG()
  }

  const handleExportPDF = () => {
    canvasRef.current?.exportToPDF()
  }

  if (error) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mapData) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Cargando mapa compartido...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
              <span className="text-sm font-medium">{mapData.title}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Solo lectura</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleExportPNG} className="h-8">
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>

            <Button variant="ghost" size="sm" onClick={handleExportPDF} className="h-8">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>

            <div className="h-6 w-px bg-border" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative">
          <MindMapCanvas ref={canvasRef} initialData={{ nodes: mapData.nodes, connections: mapData.connections }} />
        </div>

        {/* Right Info Panel */}
        <div className="w-64 border-l bg-card/30 flex-shrink-0 p-4">
          <div className="bg-card/50 rounded-lg p-4 border">
            <h4 className="text-sm font-semibold mb-3">Mapa Compartido</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>
                <strong>Título:</strong> {mapData.title}
              </div>
              <div>
                <strong>Nodos:</strong> {mapData.nodes.length}
              </div>
              <div>
                <strong>Conexiones:</strong> {mapData.connections.length}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Link href="/editor">
                <Button size="sm" className="w-full">
                  Crear Mi Propio Mapa
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3 bg-card/50 rounded-lg border">
            <h4 className="text-sm font-semibold mb-2">¿Te gusta este mapa?</h4>
            <p className="text-xs text-muted-foreground mb-3">Crea tus propios mapas mentales gratis con MindMapper</p>
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Empezar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
