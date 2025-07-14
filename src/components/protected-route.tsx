"use client"

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/user";
import {useTranslation} from "react-i18next";
import * as React from "react";

interface ProtectedRouteOptions {
    requiredRoles?: UserRole[];
    redirectTo?: string;
}

export function ProtectedRoute(
    Component: React.ComponentType,
    options: ProtectedRouteOptions = {}
) {
    return function WrappedComponent() {
        const { t } = useTranslation();
        const { isAuthenticated, hasRole } = useAuth();
        const navigate = useNavigate();
        const { requiredRoles, redirectTo = "/dashboard" } = options;

        useEffect(() => {
            const handleRedirection = async () => {
                if (!isAuthenticated) {
                    await navigate({ to: "/login" });
                    return;
                }
                if (requiredRoles && !hasRole(requiredRoles)) {
                    await navigate({ to: "/dashboard" });
                    // toast.error("Non hai i permessi necessari per accedere a questa pagina.");
                    return;
                }
            };

            handleRedirection().catch(error => {
                console.error("Error during redirection: ", error.message);
            });

        }, [isAuthenticated, requiredRoles, hasRole, navigate, redirectTo]);

        if (!isAuthenticated) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p>{t("loginRendering")}</p>
                    </div>
                </div>
            );
        }

        if (requiredRoles && !hasRole(requiredRoles)) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-500">{t("accessDenied")}</p>
                    </div>
                </div>
            );
        }

        return <Component />
    }
}