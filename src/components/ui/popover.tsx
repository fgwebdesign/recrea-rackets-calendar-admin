"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

/** Contexto para que Popovers dentro de un Dialog hagan portal al contenido del Dialog en vez de a body. */
const PopoverContainerContext = React.createContext<
  React.RefObject<HTMLElement | null> | null
>(null)

/**
 * Envuelve el contenido de un Dialog cuando hay Popovers (ej. DatePicker) dentro.
 * El portal del Popover se renderiza en este contenedor, evitando conflictos de z-index y focus.
 */
function PopoverContainerProvider({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  return (
    <PopoverContainerContext.Provider value={containerRef}>
      <div
        ref={containerRef}
        className={cn("relative z-10", className)}
        style={{ isolation: "isolate" }}
      >
        {children}
      </div>
    </PopoverContainerContext.Provider>
  )
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const containerRef = React.useContext(PopoverContainerContext)
  const container = containerRef?.current ?? undefined
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[100] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverContainerProvider,
}
