import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CityTime } from '../components/dashboard/city-time';
import PieChartComponent from '../components/dashboard/pie-chart';
import BarChartComponent from '../components/dashboard/bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useSwapiPeople } from '@/hooks/use-swapi';
import { Button } from "@/components/ui/button";
import { LogWatcher } from '@/components/layout/log-watcher';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {RotateCcw} from "lucide-react";
import { usePeopleLogWatcher } from '@/context/log-watcher-instances';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import {LoaderSpinner} from "@/components/layout/loader-spinner.tsx";

const CITY_CONFIG = [
    { city: "London", timeZone: "Europe/London", label: "London" },
    { city: "New York", timeZone: "America/New_York", label: "New York" },
    { city: "Tokyo", timeZone: "Asia/Tokyo", label: "Tokyo" },
    { city: "Sydney", timeZone: "Australia/Sydney", label: "Sydney" },
] as const;

const gridColsClassMap = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
};

const gridColsClass = gridColsClassMap[CITY_CONFIG.length] || "md:grid-cols-1";

const Dashboard = () => {
    const [isProcessingCache, setIsProcessingCache] = useState(false);
    const [cacheMessage, setCacheMessage] = useState<string | null>(null);
    const { isLoading } = useSwapiPeople();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { resetLogWatcher } = usePeopleLogWatcher();


    const handleCacheAction = useCallback(async (): Promise<void> => {
        console.clear();
        resetLogWatcher();
        setIsProcessingCache(true);
        setCacheMessage(t("processingCache"));
        try {
            queryClient.removeQueries({ queryKey: ["swapi-people"] });
            queryClient.removeQueries({ queryKey: ["favorites"] });
            queryClient.removeQueries({ queryKey: ['swapi-info-person'], exact: false });
            queryClient.removeQueries({ queryKey: ['swapi-people-total-records']});
            queryClient.removeQueries({ queryKey: ['homeworld'], exact: false });
            setCacheMessage(t("refreshingDataCache"));
            await queryClient.invalidateQueries({ queryKey: ["swapi-people"] });
            await queryClient.fetchQuery({ queryKey: ["swapi-people"] });
            setCacheMessage(t("dataCacheRefreshed"));
            setCacheMessage(t("errorProcessingCache"));
        } catch (error) {
            console.error("Error processing cache:", error);
        } finally {
            setTimeout(() => {
                setIsProcessingCache(false);
                setCacheMessage(null);
            }, 500);
        }
    }, [queryClient, t, resetLogWatcher]);

    const hasCache = queryClient.getQueryData(["swapi-people"]) !== undefined;
    const lastUpdated = queryClient.getQueryState(["swapi-people"])?.dataUpdatedAt;
    const formattedLastUpdated = lastUpdated
        ? format(new Date(lastUpdated), "PPpp", { locale: it })
        : null;

    return (
        <div className="flex flex-col">
            <div className="flex-1 space-y-4 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center sm:text-left">{t('dashboardPageTitle')}</h2>

                {hasCache && (
                    <div className="flex flex-col items-center sm:items-end gap-2">
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={handleCacheAction}
                                    className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-95 active:scale-90 text-sm sm:text-base rounded-lg px-4 py-2"
                                    disabled={isProcessingCache}
                                >
                                    <RotateCcw className="h-4 w-4 transition-transform duration-300 animate-spin"/>
                                    {t("invalidateDataCache")}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-xs">
                                <p>{t("invalidateAndRefreshDataCache")}</p>
                            </TooltipContent>
                        </Tooltip>

                        {formattedLastUpdated && (
                            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
                                {`${t("lastUpdate")} ${formattedLastUpdated}`}
                            </p>
                        )}
                    </div>
                )}
            </div>

                <div className={`grid gap-2 sm:gap-4 ${gridColsClass} sm:grid-cols-2`}>
                    {CITY_CONFIG.map(({ city, timeZone, label }) => (
                        <CityTime
                            key={city}
                            city={label}
                            timeZone={timeZone}
                        />
                    ))}
                </div>
                <div className="grid gap-2 sm:gap-4 sm:grid-cols-1 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm sm:text-base">{t("genderDistribution")}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-6">
                            {isLoading ? (
                                <LogWatcher className="h-[200px] sm:h-[300px]" useWatcherHook={usePeopleLogWatcher}/>
                            ) : (
                                isProcessingCache ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px]">
                                        <LoaderSpinner size="lg" className="mb-4"/>
                                        <p className="text-center text-muted-foreground mt-4">
                                            {cacheMessage}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full overflow-hidden -mt-15 -ml-0.5">
                                        <PieChartComponent />
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm sm:text-base">{t("characterMassComparison")}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-6">
                            {isLoading ? (
                                <LogWatcher className="h-[200px] sm:h-[300px]" useWatcherHook={usePeopleLogWatcher}/>
                            ) : (
                                isProcessingCache ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px]">
                                        <LoaderSpinner size="lg" className="mb-4"/>
                                        <p className="text-center text-muted-foreground mt-4">
                                            {cacheMessage}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full overflow-hidden -mt-8 -ml-0.5">
                                        <BarChartComponent />
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;