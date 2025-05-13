"use client"
import { LoaderSpinner } from "@/components/layout/loader-spinner";
import { Card } from "@/components/ui/card";
import {useLogWatcher} from "@/context/loader-watcher-context.tsx";

export const LogWatcher = ({ className = ""}: { className?: string}) => {
    const { currentPage, fetchingMessage } = useLogWatcher();

    return (
        <Card className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <LoaderSpinner size='lg' className="mb-4"/>
            <p className="text-center text-muted-foreground mt-4">
                {currentPage !== null ? fetchingMessage : "Loading data..."}
            </p>
        </Card>
    );
}

