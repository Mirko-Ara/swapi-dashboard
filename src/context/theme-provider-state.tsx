import {createContext} from "react";

type Theme = "dark" | "light" | "system"

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    isAuthenticated: boolean
    login: () => void
    logout: () => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    isAuthenticated: false,
    login: () => null,
    logout: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);