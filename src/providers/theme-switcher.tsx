import { useTheme } from "../providers/theme-hooks"
import { useTranslation } from 'react-i18next';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation();

    return (
        <button className="cursor-pointer border-[2px] border-gray rounded-lg p-2 font-bold" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? t("lightMode") : t("darkMode")}
        </button>
    )
}
