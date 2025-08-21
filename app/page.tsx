"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Plus, FileText, Share2, Download, Moon, Clock, Trash2 } from "lucide-react"
import Link from "next/link"
import { storage } from "@/lib/storage"

interface SavedMap {
  id: string
  title: string
  updatedAt: string
  nodes: any[]
  connections: any[]
}

export default function HomePage() {
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([])

  useEffect(() => {
    setSavedMaps(storage.getAllMindMaps())
  }, [])

  const handleDeleteMap = (mapId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este mapa?")) {
      storage.deleteMindMap(mapId)
      setSavedMaps(storage.getAllMindMaps())
    }
  }

  const handleLoadMap = (mapId: string) => {
    storage.setCurrentMapId(mapId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold font-work-sans">MindMapper</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold font-work-sans text-foreground">
              Crea Mapas Conceptuales
              <span className="text-primary"> Increíbles</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Genera mapas mentales, diagramas y mapas conceptuales de forma gratuita. Interfaz intuitiva, exportación
              en PDF/PNG y modo oscuro incluido.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-work-sans">Crear Nuevo Mapa</CardTitle>
                <CardDescription>Comienza desde cero con un lienzo en blanco</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/editor">
                  <Button className="w-full" size="lg">
                    Empezar Ahora
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {savedMaps.length > 0 && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="font-work-sans">Mapas Guardados</CardTitle>
                  <CardDescription>Continúa trabajando en tus mapas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {savedMaps.length} mapa{savedMaps.length !== 1 ? "s" : ""} guardado
                    {savedMaps.length !== 1 ? "s" : ""}
                  </p>
                  <Button variant="outline" className="w-full bg-transparent" size="lg" asChild>
                    <Link href="#saved-maps">Ver Mapas</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Saved Maps Section */}
          {savedMaps.length > 0 && (
            <div id="saved-maps" className="mt-16">
              <h3 className="text-2xl font-bold font-work-sans mb-6">Tus Mapas Guardados</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedMaps.map((map) => (
                  <Card key={map.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-work-sans truncate">{map.title}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(map.updatedAt).toLocaleDateString("es-ES")}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMap(map.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground mb-3">
                        {map.nodes.length} nodos • {map.connections.length} conexiones
                      </div>
                      <Link href="/editor" onClick={() => handleLoadMap(map.id)}>
                        <Button size="sm" className="w-full">
                          Abrir Mapa
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center space-y-3">
              <div className="mx-auto h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold font-work-sans">Comparte Fácilmente</h3>
              <p className="text-sm text-muted-foreground">
                Genera enlaces públicos para compartir tus mapas al instante
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold font-work-sans">Exporta en HD</h3>
              <p className="text-sm text-muted-foreground">Descarga tus mapas en PNG o PDF con calidad profesional</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold font-work-sans">Modo Oscuro</h3>
              <p className="text-sm text-muted-foreground">Trabaja cómodamente con el tema que prefieras</p>
            </div>
          </div>
        </div>

        {/* Ad Space - Horizontal Banner */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
            <p className="text-muted-foreground text-sm">Espacio Publicitario - Banner Horizontal</p>
            <p className="text-xs text-muted-foreground mt-1">728x90 Google Ads</p>
          </div>
        </div>
      </main>
    </div>
  )
}
