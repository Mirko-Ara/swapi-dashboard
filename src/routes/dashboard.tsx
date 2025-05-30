import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CityTime } from '../components/dashboard/city-time';
import PieChartComponent from '../components/dashboard/pie-chart';
import BarChartComponent from '../components/dashboard/bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useSwapiPeople } from '../hooks/use-swapi';
import { Button } from "@/components/ui/button";
import { LogWatcher } from '@/components/layout/log-watcher';
import { useLogWatcher } from '@/context/loader-watcher-context';
import { LoaderSpinner } from "@/components/layout/loader-spinner";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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
    const { isLoading } = useSwapiPeople();
    const queryClient = useQueryClient();
    const { setCurrentPage, setFetchingMessage } = useLogWatcher();
    const { t } = useTranslation();

    const handleCacheAction = useCallback(async (): Promise<void> => {
        setIsProcessingCache(true);
        setFetchingMessage("Processing cache...");

        try {
            queryClient.removeQueries({ queryKey: ["swapi-people"] });
            queryClient.removeQueries({ queryKey: ["favorites"] });
            queryClient.removeQueries({ queryKey: ['swapi-info-person'], exact: false });
            localStorage.removeItem("swapi-people-data");
            localStorage.removeItem("swapi-people-timestamp");
            localStorage.removeItem("favorites");
            console.clear();
            setCurrentPage(null);
            setFetchingMessage("Refreshing data...");
            await queryClient.invalidateQueries({ queryKey: ["swapi-people"] });
            await queryClient.fetchQuery({ queryKey: ["swapi-people"] });
            setFetchingMessage("Data loaded successfully!");
        } catch (error) {
            console.error("Error processing cache:", error);
            setFetchingMessage("Error processing cache");
        } finally {
            setTimeout(() => setIsProcessingCache(false), 500);
        }
    }, [queryClient, setCurrentPage, setFetchingMessage]);

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
                            <Button
                                variant="outline"
                                onClick={handleCacheAction}
                                className="cursor-pointer animate-pulse hover:scale-[0.98] active:scale-[0.96] transition-transform text-sm sm:text-base"
                                disabled={isProcessingCache}
                            >
                                {t("invalidateDataCache")}
                                {isProcessingCache && <LoaderSpinner size="sm" className="ml-2" />}
                            </Button>

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
                                <LogWatcher className="h-[200px] sm:h-[300px]" />
                            ) : (
                                <div className="w-full overflow-hidden -mt-15 -ml-0.5">
                                    <PieChartComponent />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm sm:text-base">{t("characterMassComparison")}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-6">
                            {isLoading ? (
                                <LogWatcher className="h-[200px] sm:h-[300px]" />
                            ) : (
                                <div className="w-full overflow-hidden -mt-8 -ml-0.5">
                                    <BarChartComponent />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;