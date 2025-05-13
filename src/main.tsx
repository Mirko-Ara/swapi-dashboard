import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { router } from "@/router"
import { ThemeProvider } from "./providers/theme-provider"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                <RouterProvider
                    router={router}
                    context={{
                        auth: {
                            isAuthenticated: true,
                        },
                    }}
                />
            </ThemeProvider>
        </QueryClientProvider>
    </StrictMode>
)
