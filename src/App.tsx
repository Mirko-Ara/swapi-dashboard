"use client"
import { Toaster } from "./components/ui/sonner"
import { Sidebar } from "./components/layout/sidebar"
import { Outlet } from "@tanstack/react-router"
import { useAuth } from "./providers/theme-hooks"
import { PeopleLogWatcherProvider, StarshipsLogWatcherProvider } from "@/context/log-watcher-instances";

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <PeopleLogWatcherProvider>
            <StarshipsLogWatcherProvider>
                <div className="flex min-h-screen w-full flex-col bg-background">
                    {isAuthenticated && <Sidebar />}
                    <div className="flex flex-col flex-1 w-full">
                        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                            <Outlet />
                        </main>
                    </div>
                    <Toaster />
                </div>
            </StarshipsLogWatcherProvider>
        </PeopleLogWatcherProvider>
    )
}
