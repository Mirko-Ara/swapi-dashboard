import { useTheme } from "../providers/theme-hooks";
import { Sun } from "lucide-react";
import { useTranslation } from 'react-i18next';
import React from "react";

const BlackMoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="black"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="group flex items-center justify-center cursor-pointer border-2 rounded-lg p-2 transition-colors duration-300"
            aria-label={isDark ? t("lightMode") : t("darkMode")}
            title={isDark ? t("lightMode") : t("darkMode")}
        >
            {isDark ? (
                <Sun className="w-5 h-5 transition-transform duration-300 group-hover:rotate-360"/>
            ) : (
                <BlackMoonIcon className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-360"/>
            )}
        </button>
    );
}