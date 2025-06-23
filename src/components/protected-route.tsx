"use client"

import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/hooks/use-auth"
import * as React from "react";

export function ProtectedRoute(Component: React.ComponentType) {
    return function WrappedComponent() {
        const { isAuthenticated } = useAuth();
        const navigate = useNavigate()
        useEffect(() => {
            const redirectToLogin = async () => {
                if (!isAuthenticated) {
                    await navigate({ to: "/login" })
                }
            }

            redirectToLogin().catch(error => {
                console.error("Error during redirection: ", error.message);
            });

        }, [isAuthenticated, navigate])

        if (!isAuthenticated) return null

        return <Component />
    }
}
