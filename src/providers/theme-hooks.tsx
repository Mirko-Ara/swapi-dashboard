"use client"
import { useContext } from "react"
import { ThemeProviderContext } from "@/context/theme-provider-state"
export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}

export const useAuth = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within a ThemeProvider")
    }
    return {
        isAuthenticated: context.isAuthenticated,
        login: context.login,
        logout: context.logout,
    }
}