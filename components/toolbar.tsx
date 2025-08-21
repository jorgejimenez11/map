"use client"

import { Button } from "@/components/ui/button"
import { MousePointer2, Square, Circle, Type, Minus, Trash2, Palette, Move } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Toolbar() {
  const tools = [
    { icon: MousePointer2, label: "Seleccionar", shortcut: "V" },
    { icon: Move, label: "Mover vista", shortcut: "H" },
    { icon: Square, label: "Nodo rectangular", shortcut: "R" },
    { icon: Circle, label: "Nodo circular", shortcut: "C" },
    { icon: Type, label: "Texto", shortcut: "T" },
    { icon: Minus, label: "Línea de conexión", shortcut: "L" },
    { icon: Palette, label: "Cambiar color", shortcut: "P" },
    { icon: Trash2, label: "Eliminar", shortcut: "Del" },
  ]

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center py-4 space-y-2">
        {tools.map((tool, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-accent">
                <tool.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-sm">
                {tool.label}
                <span className="ml-2 text-xs text-muted-foreground">{tool.shortcut}</span>
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
