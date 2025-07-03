"use client"
import { Toaster } from "./components/ui/sonner"
import { Sidebar } from "./components/layout/sidebar"
import { Outlet } from "@tanstack/react-router"
import { useAuth } from "@/hooks/use-auth"
import { FunFactWidget } from "@/components/ui/fun-fact-widget"

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            {isAuthenticated && <Sidebar />}
            <div className="flex flex-col flex-1 w-full">
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <Outlet />
                </main>
            </div>
            <Toaster />
            <FunFactWidget/>
        </div>
    )
}