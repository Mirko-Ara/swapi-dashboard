"use client"
import {useLocation, useNavigate} from "@tanstack/react-router";
import { useAuth } from "@/providers/theme-hooks";
import {useEffect, useState} from "react";
import {LoaderSpinner} from "@/components/layout/loader-spinner";
export default function NotFound() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [ redirecting, setRedirecting] = useState<boolean>(false);

    const protectedRoutes = ["/dashboard", "/users", "/settings"];
    const triedToAccessProtectedRoute = protectedRoutes.some((route) => location.pathname.startsWith(route));

    useEffect(() => {
        const handleRedirect = async (): Promise<void> => {
            if(!triedToAccessProtectedRoute) {
                setRedirecting(true);
                try {
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    if (isAuthenticated) {
                        await navigate({to: "/dashboard"});
                    } else {
                        await navigate({to: "/login"});
                    }
                } catch (error) {
                    console.error("Error during redirection: ", error);
                }
            }
        };

        handleRedirect().catch(error => {
            console.error("Error during redirection: ", error.message);
        });
    }, [triedToAccessProtectedRoute, isAuthenticated, navigate]);

    if (redirecting) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 min-h-screen -mt-20">
                <LoaderSpinner className="w-10 h-10" />
                <p className="text-base text-muted-foreground font-medium">Redirecting...</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
            <h1 className="text-4xl font-bold">404</h1>
            {triedToAccessProtectedRoute && !isAuthenticated ? (
                <p className="text-lg text-destructive font-medium">
                    You must be authenticated to access this page.
                </p>
            ) : (
                <p className="text-lg">Page not found</p>
            )}
        </div>
    );
}
