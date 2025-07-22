"use client"
import { LoaderSpinner } from "@/components/layout/loader-spinner";
import { Card } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import {useEffect, useState} from "react";
import type { LogWatcherContextType } from '@/store/people-log-watcher-slice';

interface LogWatcherProps {
    className?: string,
    useWatcherHook: () => LogWatcherContextType;
}

export const LogWatcher = ({ className = "", useWatcherHook}: LogWatcherProps) => {
    const { t } = useTranslation();
    const [deviceType, setDeviceType] = useState<"smallMobile" | "mobile" | "tablet" | "desktop">("desktop");


    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width < 480) setDeviceType("smallMobile");
            else if (width >= 480 && width < 640) setDeviceType("mobile");
            else if (width >= 640 && width < 1024) setDeviceType("tablet");
            else setDeviceType("desktop");
        }
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const { currentPage, totalPages, fetchingMessage } = useWatcherHook();

    return (
        <Card className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <LoaderSpinner size={deviceType === "smallMobile" ? "md" : deviceType === "mobile" ? "md" : deviceType === "tablet" ? "lg" : "xl"} className="mb-4"/>
            <p className="text-center text-muted-foreground mt-4">
                {currentPage === null || totalPages === null ? t("loadingData") : fetchingMessage}
            </p>
        </Card>
    );
}