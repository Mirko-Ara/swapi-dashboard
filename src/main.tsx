import "./i18n";
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { router } from "@/router"
import { ThemeProvider } from "./providers/theme-provider"
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'swapi-cache',
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            gcTime: Infinity,
            retry: 2,
            retryDelay: 1000,
        }
    }
});

if(typeof window !== 'undefined') {
    persistQueryClient({
        queryClient,
        persister: localStoragePersister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        buster: '1.0.0'
        }
    )
}

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
);