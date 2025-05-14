"use client"
import { ThemeSwitcher } from '@/providers/theme-switcher';
import { Link, useRouter } from "@tanstack/react-router"
import { Button } from "../ui/button"
import { LayoutDashboard, Users, Settings, Menu, LogOut } from "lucide-react"
import {useEffect, useState} from "react"
import { useAuth } from "@/providers/theme-hooks"
import { LoaderSpinner } from "@/components/layout/loader-spinner";

export const Sidebar = () => {
    const router = useRouter()
    const currentPath = router.state.location.pathname
    const [mobileToggle, setMobileToggle] = useState(false)
    const { logout } = useAuth()
    const [ logoutRedirecting, setLogOutRedirecting] = useState<boolean>(false);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, [mobileToggle]);
    const handleLogout = () => {
        setLogOutRedirecting(true);
        setTimeout(async () => {
            try {
                logout();
                await router.navigate({to: "/"})
            } catch(error) {
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
                <LoaderSpinner className="w-10 h-10" />
                <p className="text-base font-medium text-muted-foreground">Logging out...</p>
            </div>
        );
    }

    return (
        <>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50" onClick={toggleMobile}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            <div className={`${mobileToggle ? "block" : "hidden"} md:${mobileToggle ? "block" : "hidden"} ...`}>
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
                        <Link to="/dashboard" className="flex items-center justify-center gap-2 font-semibold w-full" onClick={() => setMobileToggle(false)}>
                            <span className="text-center w-full">SWAPI Dashboard</span>
                        </Link>
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
                                Dashboard
                            </Link>
                            <Link
                                to="/users"
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary
                                ${currentPath === "/users" ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                onClick={() => setMobileToggle(false)}
                            >
                                <Users className="h-4 w-4" />
                                Users
                            </Link>
                            <Link
                                to="/settings"
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary
                                ${currentPath === "/settings" ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                onClick={() => setMobileToggle(false)}
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                            <ThemeSwitcher/>
                        </nav>
                    </div>
                    <div className="p-4">
                        <Button variant="outline" className="w-full" onClick={handleLogout} disabled={logoutRedirecting}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}
