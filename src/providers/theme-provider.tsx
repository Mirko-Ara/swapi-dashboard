"use client"

import {useEffect, useState } from "react"
import { ThemeProviderContext } from "@/context/theme-provider-state"
import type { ReactNode } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: ReactNode
    defaultTheme?: Theme
    storageKey?: string
}


export function ThemeProvider({
                                  children,
                                  defaultTheme = "system",
                                  storageKey = "vite-ui-theme",
                              }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

    useEffect(() => {
            const root = window.document.documentElement
            root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"
            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const login = () => {
        setIsAuthenticated(true)
        localStorage.setItem("auth", "true")
    }

    const logout = () => {
        setIsAuthenticated(false)
        localStorage.removeItem("auth")
    }

    useEffect(() => {
        const auth = localStorage.getItem("auth")
        if (auth === "true") {
            setIsAuthenticated(true)
        }
    }, [])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        isAuthenticated,
        login,
        logout,
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
