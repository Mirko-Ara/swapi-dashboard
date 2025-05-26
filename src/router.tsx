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

// Root Route
const rootRoute = createRootRoute({
    component: App,
    notFoundComponent: NotFound,
})

// Public route: login
const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: Login,
})

// Protected routes
const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard",
    component: ProtectedRoute(Dashboard),
})

const usersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/users",
    component: ProtectedRoute(Users),
})

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/settings",
    component: ProtectedRoute(Settings),
})

const routeTree = rootRoute.addChildren([
    loginRoute,
    dashboardRoute,
    usersRoute,
    settingsRoute,
])

// Create router
export const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    context: {
        auth: undefined!,
    },
})

// Type override
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}
