"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";
import * as React from "react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
          className:
              "text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4 rounded-md sm:rounded-lg shadow-lg",
          descriptionClassName: "text-xs sm:text-sm text-muted-foreground",
          style: {
              fontSize: "1rem",
          },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster}