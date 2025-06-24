"use client"
import { ThemeSwitcher } from '@/providers/theme-switcher';
import { Link, useRouter } from "@tanstack/react-router"
import { Button } from "../ui/button"
import { LayoutDashboard, Users, Settings, Rocket, Menu, LogOut, Globe } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { LoaderSpinner } from "@/components/layout/loader-spinner";
import { useTranslation } from 'react-i18next';

export const Sidebar = ({ onToggle }: { onToggle?: (open: boolean) => void }) => {
    const router = useRouter();
    const currentPath = router.state.location.pathname;
    const [mobileToggle, setMobileToggle] = useState(false);
    const { logout } = useAuth();
    const [logoutRedirecting, setLogOutRedirecting] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const toggleButtonRef = useRef<HTMLButtonElement>(null);
    const { t, i18n } = useTranslation();
    const languages = {
        en: { label: t("languageEn") },
        it: { label: t("languageIt") },
        es: { label: t("languageEs") },
    };
    useEffect(() => {
        i18n.changeLanguage(i18n.language).catch(console.error);
    }, [i18n]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            const target = event.target as Node;
            if (
                sidebarRef.current && !sidebarRef.current.contains(target) &&
                toggleButtonRef.current && !toggleButtonRef.current.contains(target)
            ) {
                if (mobileToggle) setMobileToggle(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [mobileToggle]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        onToggle?.(mobileToggle);
    }, [mobileToggle, onToggle]);

    const handleLogout = () => {
        setLogOutRedirecting(true);
        setTimeout(async () => {
            try {
                logout();
                await router.navigate({ to: "/" })
            } catch (error) {
                console.error("Error during redirection: ", error);
            }
        }, 900);
    }

    const toggleMobile = () => {
        setMobileToggle(!mobileToggle)
    }

    if (logoutRedirecting) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 w-full h-screen bg-background">
                <LoaderSpinner size="xl"/>
                <p className="text-xl text-muted-foreground font-medium">
                    {t('loggingOut')}
                </p>
            </div>
        );
    }

    return (
        <>
            <Button
                ref={toggleButtonRef}
                variant="ghost"
                size="icon"
                className="cursor-pointer fixed top-4 left-4 z-50"
                onClick={toggleMobile}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('toggleMenu')}</span>
            </Button>

            <div
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full w-64 bg-background shadow-lg z-50 transform transition-transform duration-300 ease-in-out
                ${mobileToggle ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto max-h-screen`}
            >
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px]">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            onClick={toggleMobile}
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">{t('toggleMenu')}</span>
                        </Button>
                        <Link
                            to="/dashboard"
                            onClick={() => setMobileToggle(false)}
                            className="flex-1 text-center font-semibold truncate"
                        >
                            {t('dashboardTitle')}
                        </Link>
                        <div className="w-[40px]" />
                    </div>

                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            <Link
                                to="/dashboard"
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary
                                ${currentPath === "/dashboard" ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                onClick={() => setMobileToggle(false)}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                {t('dashboard')}
                            </Link>
                            <Link
                                to="/characters"
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary
                                ${currentPath === "/characters" ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                onClick={() => setMobileToggle(false)}
                            >
                                <Users className="h-4 w-4" />
                                {t('characters')}
                            </Link>
                            <Link
                                to="/settings"
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary
                                ${currentPath === "/settings" ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                onClick={() => setMobileToggle(false)}
                            >
                                <Settings className="h-4 w-4" />
                                {t('settings')}
                            </Link>
                            <Link
                                to="/starships"
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary mb-2
                                ${currentPath === "/starships " ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                onClick={() => setMobileToggle(false)}
                            >
                                <Rocket className="h-4 w-4" />
                                {t("starships")}
                            </Link>
                            <ThemeSwitcher/>
                        </nav>

                        <div className="mt-4 px-4">
                            <label htmlFor="language-select" className="flex items-center gap-2 mb-1 text-xs font-semibold text-muted-foreground uppercase">
                                <Globe className="h-4 w-4" />{t('selectLanguage')}
                            </label>
                            <select
                                id="language-select"
                                className="cursor-pointer w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                value={i18n.language}
                                onChange={async (e) => {
                                    await i18n.changeLanguage(e.target.value);
                                    setMobileToggle(false);
                                }}
                            >
                                {Object.entries(languages).map(([code, { label }]) => (
                                    <option key={code} value={code}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-4">
                        <Button variant="outline" className="cursor-pointer w-full" onClick={handleLogout} disabled={logoutRedirecting}>
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('logout')}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}