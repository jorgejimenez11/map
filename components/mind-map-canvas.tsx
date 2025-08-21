"use client"

import React from "react"

import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

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

interface MindMapCanvasProps {
  onDataChange?: (nodes: Node[], connections: Connection[]) => void
  initialData?: { nodes: Node[]; connections: Connection[] }
}

export interface MindMapCanvasRef {
  exportToPNG: () => void
  exportToPDF: () => void
  getCurrentData: () => { nodes: Node[]; connections: Connection[] }
  loadData: (data: { nodes: Node[]; connections: Connection[] }) => void
}

export const MindMapCanvas = forwardRef<MindMapCanvasRef, MindMapCanvasProps>(({ onDataChange, initialData }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<Node[]>(
    initialData?.nodes || [
      {
        id: "1",
        x: 400,
        y: 300,
        width: 120,
        height: 60,
        text: "Idea Central",
        color: "#15803d",
        shape: "rectangle",
      },
    ],
  )
  const [connections, setConnections] = useState<Connection[]>(initialData?.connections || [])
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragNodeId, setDragNodeId] = useState<string | null>(null)

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    onDataChange?.(nodes, connections)
  }, [nodes, connections, onDataChange])

  useImperativeHandle(ref, () => ({
    exportToPNG: async () => {
      setIsExporting(true)
      try {
        // Dynamic import to avoid SSR issues
        const html2canvas = (await import("html2canvas")).default

        if (!svgRef.current) return

        // Create a temporary container with white background
        const tempContainer = document.createElement("div")
        tempContainer.style.position = "absolute"
        tempContainer.style.left = "-9999px"
        tempContainer.style.top = "-9999px"
        tempContainer.style.width = "1200px"
        tempContainer.style.height = "800px"
        tempContainer.style.backgroundColor = "white"
        tempContainer.style.padding = "20px"

        // Clone the SVG
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement
        svgClone.style.width = "1160px"
        svgClone.style.height = "760px"
        svgClone.setAttribute("viewBox", "0 0 1200 800")

        // Remove interactive elements from clone
        const interactiveElements = svgClone.querySelectorAll("[stroke-dasharray]")
        interactiveElements.forEach((el) => el.remove())

        tempContainer.appendChild(svgClone)
        document.body.appendChild(tempContainer)

        // Generate canvas
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
        })

        // Clean up
        document.body.removeChild(tempContainer)

        // Download
        const link = document.createElement("a")
        link.download = `mapa-mental-${new Date().toISOString().split("T")[0]}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
      } catch (error) {
        console.error("Error exporting PNG:", error)
        alert("Error al exportar PNG. Por favor, intenta de nuevo.")
      } finally {
        setIsExporting(false)
      }
    },
    exportToPDF: async () => {
      setIsExporting(true)
      try {
        // Dynamic imports to avoid SSR issues
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ])

        if (!svgRef.current) return

        // Create a temporary container
        const tempContainer = document.createElement("div")
        tempContainer.style.position = "absolute"
        tempContainer.style.left = "-9999px"
        tempContainer.style.top = "-9999px"
        tempContainer.style.width = "1200px"
        tempContainer.style.height = "800px"
        tempContainer.style.backgroundColor = "white"
        tempContainer.style.padding = "20px"

        // Clone the SVG
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement
        svgClone.style.width = "1160px"
        svgClone.style.height = "760px"
        svgClone.setAttribute("viewBox", "0 0 1200 800")

        // Remove interactive elements from clone
        const interactiveElements = svgClone.querySelectorAll("[stroke-dasharray]")
        interactiveElements.forEach((el) => el.remove())

        tempContainer.appendChild(svgClone)
        document.body.appendChild(tempContainer)

        // Generate canvas
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
        })

        // Clean up
        document.body.removeChild(tempContainer)

        // Create PDF
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        })

        const imgData = canvas.toDataURL("image/png")
        const imgWidth = 277 // A4 landscape width in mm minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Add title
        pdf.setFontSize(16)
        pdf.text("Mapa Mental", 20, 20)

        // Add image
        pdf.addImage(imgData, "PNG", 10, 30, imgWidth, Math.min(imgHeight, 180))

        // Add footer
        pdf.setFontSize(10)
        pdf.text(`Generado el ${new Date().toLocaleDateString("es-ES")} con MindMapper`, 10, 200)

        // Download
        pdf.save(`mapa-mental-${new Date().toISOString().split("T")[0]}.pdf`)
      } catch (error) {
        console.error("Error exporting PDF:", error)
        alert("Error al exportar PDF. Por favor, intenta de nuevo.")
      } finally {
        setIsExporting(false)
      }
    },
    getCurrentData: () => ({ nodes, connections }),
    loadData: (data) => {
      setNodes(data.nodes)
      setConnections(data.connections)
      setSelectedNodeId(null)
    },
  }))

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()

      if (e.shiftKey && selectedNodeId && selectedNodeId !== nodeId) {
        const newConnection: Connection = {
          id: Date.now().toString(),
          fromNodeId: selectedNodeId,
          toNodeId: nodeId,
        }
        setConnections((prev) => [...prev, newConnection])
        setSelectedNodeId(null)
        return
      }

      setSelectedNodeId(nodeId)
    },
    [selectedNodeId],
  )

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        setEditingNodeId(nodeId)
        setEditingText(node.text)
      }
    },
    [nodes],
  )

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(e.target.value)
  }, [])

  const handleTextSubmit = useCallback(() => {
    if (editingNodeId && editingText.trim()) {
      setNodes((prev) => prev.map((node) => (node.id === editingNodeId ? { ...node, text: editingText.trim() } : node)))
    }
    setEditingNodeId(null)
    setEditingText("")
  }, [editingNodeId, editingText])

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleTextSubmit()
      } else if (e.key === "Escape") {
        setEditingNodeId(null)
        setEditingText("")
      }
    },
    [handleTextSubmit],
  )

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()

      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          const svgX = viewBox.x + (e.clientX - rect.left) / zoom
          const svgY = viewBox.y + (e.clientY - rect.top) / zoom

          setDragOffset({
            x: svgX - node.x,
            y: svgY - node.y,
          })
        }
      }

      setIsDragging(true)
      setDragNodeId(nodeId)
      setSelectedNodeId(nodeId)
      setDragStart({ x: e.clientX, y: e.clientY })
    },
    [nodes, viewBox, zoom],
  )

  const handleNodeMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && dragNodeId) {
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          const svgX = viewBox.x + (e.clientX - rect.left) / zoom
          const svgY = viewBox.y + (e.clientY - rect.top) / zoom

          setNodes((prev) =>
            prev.map((node) =>
              node.id === dragNodeId
                ? {
                    ...node,
                    x: svgX - dragOffset.x,
                    y: svgY - dragOffset.y,
                  }
                : node,
            ),
          )
        }
      }
    },
    [isDragging, dragNodeId, viewBox, zoom, dragOffset],
  )

  const handleNodeMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragNodeId(null)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  const handleNodeMouseEnter = useCallback((nodeId: string) => {
    setHoveredNodeId(nodeId)
  }, [])

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
  }, [])

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId))
    setConnections((prev) => prev.filter((conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId))
    setSelectedNodeId(null)
  }, [])

  const handleDeleteConnection = useCallback((connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
  }, [])

  const handleChangeNodeColor = useCallback((nodeId: string, color: string) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, color } : node)))
  }, [])

  const handleChangeNodeShape = useCallback((nodeId: string, shape: "rectangle" | "circle") => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, shape } : node)))
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setSelectedNodeId(null)
      setIsConnecting(false)
      setConnectionStart(null)
      setTempConnection(null)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+click for panning
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const deltaX = (e.clientX - panStart.x) / zoom
        const deltaY = (e.clientY - panStart.y) / zoom

        setViewBox((prev) => ({
          ...prev,
          x: prev.x - deltaX,
          y: prev.y - deltaY,
        }))

        setPanStart({ x: e.clientX, y: e.clientY })
      } else {
        handleNodeMouseMove(e)
      }
    },
    [isPanning, panStart, zoom, handleNodeMouseMove],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    handleNodeMouseUp()
  }, [handleNodeMouseUp])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedNodeId) {
        if (e.key === "Delete" || e.key === "Backspace") {
          handleDeleteNode(selectedNodeId)
        } else if (e.key === "Enter") {
          const node = nodes.find((n) => n.id === selectedNodeId)
          if (node) {
            setEditingNodeId(selectedNodeId)
            setEditingText(node.text)
          }
        } else if (e.key === "d" && e.ctrlKey) {
          e.preventDefault()
          const node = nodes.find((n) => n.id === selectedNodeId)
          if (node) {
            const newNode: Node = {
              ...node,
              id: Date.now().toString(),
              x: node.x + 20,
              y: node.y + 20,
              text: node.text + " (copia)",
            }
            setNodes((prev) => [...prev, newNode])
            setSelectedNodeId(newNode.id)
          }
        }
      }
    },
    [selectedNodeId, handleDeleteNode, nodes],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(3, zoom * delta))

      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const svgX = viewBox.x + mouseX / zoom
        const svgY = viewBox.y + mouseY / zoom

        setViewBox((prev) => ({
          ...prev,
          x: svgX - mouseX / newZoom,
          y: svgY - mouseY / newZoom,
        }))
      }

      setZoom(newZoom)
    },
    [zoom, viewBox],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const svgX = viewBox.x + (e.clientX - rect.left) / zoom
        const svgY = viewBox.y + (e.clientY - rect.top) / zoom

        const newNode: Node = {
          id: Date.now().toString(),
          x: svgX - 60,
          y: svgY - 30,
          width: 120,
          height: 60,
          text: "Nueva Idea",
          color: "#84cc16",
          shape: "rectangle",
        }

        setNodes((prev) => [...prev, newNode])
        setSelectedNodeId(newNode.id)
      }
    },
    [viewBox, zoom],
  )

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null

  return (
    <div className="w-full h-full relative bg-background">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-card/80 backdrop-blur rounded-lg p-2 border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom((prev) => Math.min(3, prev * 1.2))}
          className="h-8 w-8 p-0"
        >
          +
        </Button>
        <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom((prev) => Math.max(0.1, prev * 0.8))}
          className="h-8 w-8 p-0"
        >
          -
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setZoom(1)
            setViewBox({ x: 0, y: 0, width: 1200, height: 800 })
          }}
          className="h-8 px-2 text-xs"
        >
          Reset
        </Button>
      </div>

      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 w-64">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Propiedades del Nodo</h3>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Color</label>
                <div className="flex gap-2">
                  {["#15803d", "#84cc16", "#3b82f6", "#ef4444", "#8b5cf6", "#f59e0b"].map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border-2 border-transparent hover:border-foreground transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => handleChangeNodeColor(selectedNode.id, color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Forma</label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedNode.shape === "rectangle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChangeNodeShape(selectedNode.id, "rectangle")}
                    className="flex-1"
                  >
                    Rectángulo
                  </Button>
                  <Button
                    variant={selectedNode.shape === "circle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChangeNodeShape(selectedNode.id, "circle")}
                    className="flex-1"
                  >
                    Círculo
                  </Button>
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="w-full"
              >
                Eliminar Nodo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-card/80 backdrop-blur rounded-lg p-3 border max-w-xs">
        <p className="text-xs text-muted-foreground">
          <strong>Doble clic:</strong> Crear nodo
          <br />
          <strong>Clic:</strong> Seleccionar nodo
          <br />
          <strong>Shift + Clic:</strong> Conectar nodos
          <br />
          <strong>Doble clic en nodo:</strong> Editar texto
          <br />
          <strong>Arrastrar nodo:</strong> Mover
          <br />
          <strong>Ctrl + D:</strong> Duplicar nodo
          <br />
          <strong>Delete:</strong> Eliminar seleccionado
          <br />
          <strong>Ctrl + Arrastrar:</strong> Mover vista
        </p>
      </div>

      {editingNodeId && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50">
          <Card>
            <CardContent className="p-4">
              <Input
                value={editingText}
                onChange={handleTextChange}
                onKeyDown={handleTextKeyDown}
                onBlur={handleTextSubmit}
                placeholder="Texto del nodo..."
                className="w-64"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">Presiona Enter para guardar, Escape para cancelar</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isExporting && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Exportando mapa mental...</p>
              <p className="text-xs text-muted-foreground mt-1">Esto puede tomar unos segundos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={handleCanvasClick}
      >
        {/* Grid Pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border opacity-30"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connections */}
        {connections.map((connection) => {
          const fromNode = nodes.find((n) => n.id === connection.fromNodeId)
          const toNode = nodes.find((n) => n.id === connection.toNodeId)

          if (!fromNode || !toNode) return null

          return (
            <g key={connection.id}>
              <line
                x1={fromNode.x + fromNode.width / 2}
                y1={fromNode.y + fromNode.height / 2}
                x2={toNode.x + toNode.width / 2}
                y2={toNode.y + toNode.height / 2}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
              />
              <circle
                cx={(fromNode.x + fromNode.width / 2 + toNode.x + toNode.width / 2) / 2}
                cy={(fromNode.y + fromNode.height / 2 + toNode.y + toNode.height / 2) / 2}
                r="8"
                fill="currentColor"
                className="text-destructive opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteConnection(connection.id)
                }}
              />
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {selectedNodeId === node.id && (
              <>
                {node.shape === "rectangle" ? (
                  <rect
                    x={node.x - 4}
                    y={node.y - 4}
                    width={node.width + 8}
                    height={node.height + 8}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    rx="12"
                    className="text-primary animate-pulse"
                  />
                ) : (
                  <circle
                    cx={node.x + node.width / 2}
                    cy={node.y + node.height / 2}
                    r={Math.max(node.width, node.height) / 2 + 4}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="text-primary animate-pulse"
                  />
                )}
              </>
            )}

            {hoveredNodeId === node.id && selectedNodeId && selectedNodeId !== node.id && (
              <>
                {node.shape === "rectangle" ? (
                  <rect
                    x={node.x - 2}
                    y={node.y - 2}
                    width={node.width + 4}
                    height={node.height + 4}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    rx="10"
                    className="text-secondary"
                  />
                ) : (
                  <circle
                    cx={node.x + node.width / 2}
                    cy={node.y + node.height / 2}
                    r={Math.max(node.width, node.height) / 2 + 2}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-secondary"
                  />
                )}
              </>
            )}

            {node.shape === "rectangle" ? (
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={node.color}
                rx="8"
                className="cursor-move hover:opacity-80 transition-opacity"
                onClick={(e) => handleNodeClick(e, node.id)}
                onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => handleNodeMouseEnter(node.id)}
                onMouseLeave={handleNodeMouseLeave}
              />
            ) : (
              <circle
                cx={node.x + node.width / 2}
                cy={node.y + node.height / 2}
                r={Math.max(node.width, node.height) / 2}
                fill={node.color}
                className="cursor-move hover:opacity-80 transition-opacity"
                onClick={(e) => handleNodeClick(e, node.id)}
                onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => handleNodeMouseEnter(node.id)}
                onMouseLeave={handleNodeMouseLeave}
              />
            )}

            <text
              x={node.x + node.width / 2}
              y={node.y + node.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="14"
              fontWeight="500"
              className="pointer-events-none select-none"
            >
              {node.text}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
})

MindMapCanvas.displayName = "MindMapCanvas"
