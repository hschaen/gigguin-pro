"use client"

import * as React from "react"

interface SeparatorProps {
  orientation?: "horizontal" | "vertical"
  className?: string
}

const Separator = React.forwardRef<
  React.ElementRef<"div">,
  SeparatorProps
>(({ orientation = "horizontal", className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`shrink-0 bg-border ${
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"
    } ${className}`}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }