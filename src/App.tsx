"use client"
import { Toaster } from "./components/ui/sonner"
import { Sidebar } from "./components/layout/sidebar"
import {Outlet, useRouter} from "@tanstack/react-router"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { FunFactWidget } from "@/components/ui/fun-fact-widget"

export default function App() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const locationKey = router.state.location.pathname;

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            {isAuthenticated && <Sidebar />}
            <div className="flex flex-col flex-1 w-full">
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <AnimatePresence mode="wait">
                        <div key={locationKey}>
                            <Outlet />
                        </div>
                    </AnimatePresence>
                </main>
            </div>
            <Toaster />
            <FunFactWidget/>
        </div>
    )
}