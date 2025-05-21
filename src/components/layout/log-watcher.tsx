"use client"
import { LoaderSpinner } from "@/components/layout/loader-spinner";
import { Card } from "@/components/ui/card";
import {useLogWatcher} from "@/context/loader-watcher-context";
import { useTranslation } from 'react-i18next';

export const LogWatcher = ({ className = ""}: { className?: string}) => {
    const { t } = useTranslation();
    const { currentPage, fetchingMessage } = useLogWatcher();
    return (
        <Card className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <LoaderSpinner size='lg' className="mb-4"/>
            <p className="text-center text-muted-foreground mt-4">
                {currentPage !== null ? fetchingMessage : t("loadingData")}
            </p>
        </Card>
    );
}

