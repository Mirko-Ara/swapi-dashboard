import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { Provider } from 'react-redux';
import { store } from './store/store-index';
import { initializeLogInterceptor } from '@/store/log-interceptor';

const localStoragePersister = createAsyncStoragePersister({
    storage: window.localStorage,
    key: 'swapi-cache',
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 60 * 24,
            gcTime: 1000 * 60 * 60 * 24,
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

if (typeof window !== 'undefined') {
    initializeLogInterceptor(store);
}


createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <RouterProvider
                    router={router}
                    context={{}}
                />
            </Provider>
            {process.env.NODE_ENV === 'development' && (typeof window !== "undefined" && window.location.hostname === 'localhost') && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    </StrictMode>
);