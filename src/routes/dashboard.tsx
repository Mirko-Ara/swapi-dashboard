import React, {useState, useCallback, useRef} from 'react';
import {type QueryKey, type QueryState, useQueryClient} from '@tanstack/react-query';
import { CityTime } from '../components/dashboard/city-time';
import PieChartComponent from '../components/dashboard/pie-chart';
import BarChartComponent from '../components/dashboard/bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {RotateCcw} from "lucide-react";
import { usePeopleLogWatcher } from '@/hooks/use-people-log-watcher';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { PageTransitionWrapper } from "@/components/ui/page-transition-wrapper";
import {LoaderSpinner} from "@/components/layout/loader-spinner.tsx";
import type {ChartComponentProps} from "@/components/dashboard/pie-chart";


const MemoizedPieChartComponent = React.memo((props: ChartComponentProps) => <PieChartComponent {...props} />);
const MemoizedBarChartComponent = React.memo((props: ChartComponentProps) => <BarChartComponent {...props} />);

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
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { resetLogWatcher } = usePeopleLogWatcher();
    const pieChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);

    const handleCacheAction = useCallback(async (): Promise<void> => {
        resetLogWatcher();
        setIsProcessingCache(true);
        setCacheMessage(t("processingCache"));
        try {
            localStorage.removeItem('pieChartCurrentPage');
            localStorage.removeItem('accumulatedMasses');
            localStorage.removeItem('processedPagesPieChart');
            localStorage.removeItem('barChartCurrentPage');
            localStorage.removeItem('accumulatedGenders');
            localStorage.removeItem('processedPagesBarChart');
            queryClient.removeQueries({ queryKey: ["genderData"], exact: false });
            queryClient.removeQueries({ queryKey: ["massData"], exact: false });
            queryClient.removeQueries({ queryKey: ["favorites"] });
            queryClient.removeQueries({ queryKey: ['favoritesStarships']});
            queryClient.removeQueries({ queryKey: ['favoritesSpecies']});
            queryClient.removeQueries({ queryKey: ['swapi-info-person'], exact: false });
            queryClient.removeQueries({ queryKey: ['swapi-info-starship-extra'], exact: false });
            queryClient.removeQueries({ queryKey: ['swapi-info-species-extra'], exact: false });
            queryClient.removeQueries({ queryKey: ['homeworld'], exact: false });
            setCacheMessage(t("refreshingDataCache"));
            await queryClient.invalidateQueries({ queryKey: ["swapi-people"] });
            await queryClient.invalidateQueries({ queryKey: ["swapi-starships"] });
            await queryClient.invalidateQueries({ queryKey: ["swapi-species"] });
            setCacheMessage(t("dataCacheRefreshed"));
        } catch (error) {
            console.error("Error processing cache:", error);
            setCacheMessage(t("errorProcessingCache"));
        } finally {
            setTimeout(() => {
                setIsProcessingCache(false);
                setCacheMessage(null);
            }, 500);
        }
    }, [queryClient, t, resetLogWatcher]);

    const hasCache = queryClient.getQueriesData({ queryKey: ["swapi-people"] }).length > 0;

    const latestQueryState = queryClient.getQueriesData({ queryKey: ["swapi-people"] }).reduce<QueryState<unknown, Error> | undefined>((latest, [queryKey]) => {
        const currentState = queryClient.getQueryState(queryKey as QueryKey);

        if (
            currentState &&
            (!latest || (currentState.dataUpdatedAt && currentState.dataUpdatedAt > (latest.dataUpdatedAt ?? 0)))
        ) {
            return currentState;
        }

        return latest;
    }, undefined);


    const lastUpdated = latestQueryState?.dataUpdatedAt;
    const formattedLastUpdated = lastUpdated
        ? format(new Date(lastUpdated), "PPpp", { locale: it })
        : null;

    return (
        <PageTransitionWrapper>
            <div className="flex flex-col">
                <div className="flex-1 space-y-4 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center sm:text-left ">{t('dashboardPageTitle')}</h2>
                        {hasCache && (
                            <div className="flex flex-col items-center sm:items-end gap-2">
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            onClick={handleCacheAction}
                                            className="flex items-center justify-center gap-1 sm:gap-2
                                                cursor-pointer
                                                transition-transform hover:scale-95 active:scale-90
                                                text-xs sm:text-sm md:text-base rounded-lg
                                                px-3 py-1.5 sm:px-4 sm:py-2"
                                            disabled={isProcessingCache}
                                        >
                                            <RotateCcw className="h-4 w-4 transition-transform duration-300 animate-spin" />
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
                    <div
                        className="grid gap-2 sm:gap-4 sm:grid-cols-1 md:grid-cols-2"
                    >
                        <Card ref={pieChartRef}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm sm:text-base">{t("characterMassComparison")}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 sm:p-6">
                                {isProcessingCache ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px]">
                                        <LoaderSpinner size="lg" className="mb-4" />
                                        <p className="text-center text-muted-foreground mt-4">
                                            {cacheMessage}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full overflow-hidden -mt-15 -ml-0.5">
                                        <MemoizedPieChartComponent excludedRef={barChartRef}/>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card ref={barChartRef}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm sm:text-base">{t("genderDistribution")}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 sm:p-6">
                                {isProcessingCache ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px]">
                                        <LoaderSpinner size="lg" className="mb-4" />
                                        <p className="text-center text-muted-foreground mt-4">
                                            {cacheMessage}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full overflow-hidden -mt-8 -ml-0.5">
                                        <MemoizedBarChartComponent excludedRef={pieChartRef}/>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PageTransitionWrapper>
    );
};

export default Dashboard;