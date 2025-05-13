import { useTheme } from "../providers/theme-hooks"

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()

    return (
        <button className="border-[2px] border-gray rounded-lg p-2 font-bold" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            Switch to {theme === "dark" ? "light" : "dark"} mode
        </button>
    )
}
