import {
    createRootRoute,
    createRoute,
    createRouter,
} from "@tanstack/react-router"
import Login from "./routes/login"
import Dashboard from "./routes/dashboard"
import Users from "./routes/users"
import Settings from "./routes/settings"
import App from "./App"
import NotFound from "./components/not-found"
import { ProtectedRoute } from "./components/protected-route"
import { Starships } from "./routes/starships";
import { z  } from "zod";
import {Species}  from "./routes/species";

const rootRoute = createRootRoute({
    component: App,
    notFoundComponent: NotFound,
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: Login,
});

const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard",
    component: ProtectedRoute(Dashboard),
});

const usersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/characters",
    component: ProtectedRoute(Users),
    validateSearch: z.object({
        page: z.number().int().min(1).catch(1),
        limit: z.number().int().max(10).catch(10)
    }),
});

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/settings",
    component: ProtectedRoute(Settings),
});

const starshipsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/starships",
    component: ProtectedRoute(Starships),
    validateSearch: z.object({
        page: z.number().int().min(1).catch(1),
        limit: z.number().int().min(1).max(10).catch(10),
    }),
});

const speciesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/species",
    component: ProtectedRoute(Species),
    validateSearch: z.object({
            page: z.number().int().min(1).catch(1),
            limit: z.number().int().min(1).max(10).catch(10),
    })
});

const routeTree = rootRoute.addChildren([
    loginRoute,
    dashboardRoute,
    usersRoute,
    settingsRoute,
    starshipsRoute,
    speciesRoute
]);

export const router = createRouter({
    routeTree,
    defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}