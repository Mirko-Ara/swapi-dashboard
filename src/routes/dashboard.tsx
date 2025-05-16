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
    const { isLoading, refetch } = useSwapiPeople();
    const queryClient = useQueryClient();
    const { setCurrentPage, setFetchingMessage } = useLogWatcher();

    const handleCacheAction = useCallback(async (): Promise<void> => {
        setIsProcessingCache(true);
        setFetchingMessage("Processing cache...");

        try {
            queryClient.removeQueries({queryKey: ["swapi-people"]});
            localStorage.removeItem("swapi-people-data");
            localStorage.removeItem("swapi-people-timestamp");
            console.clear();
            setCurrentPage(null);
            setFetchingMessage("Refreshing data...");
            await refetch();

            setFetchingMessage("Data loaded successfully !");
        } catch (error) {
            console.error("Error processing cache:", error);
            setFetchingMessage("Error processing cache");
        } finally {
            setTimeout(() => setIsProcessingCache(false), 500);
        }
    }, [queryClient, refetch, setCurrentPage, setFetchingMessage]);

    const hasCache = queryClient.getQueryData(["swapi-people"]) !== undefined;
    const lastUpdated = queryClient.getQueryState(["swapi-people"])?.dataUpdatedAt;
    const formattedLastUpdated = lastUpdated
        ? format(new Date(lastUpdated), "PPpp", { locale: it })
        : null;

    return (
        <div className="flex flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">SWAPI Dashboard</h2>

                    {hasCache && (
                        <div className="flex flex-col items-end gap-1">
                            <Button
                                variant="outline"
                                onClick={handleCacheAction}
                                className="cursor-pointer hover:scale-[0.98] active:scale-[0.96] transition-transform"
                                disabled={isProcessingCache}
                            >
                                Invalidate/Refresh Data Cache
                                {isProcessingCache && <LoaderSpinner size="sm" className="ml-2" />}
                            </Button>

                            {formattedLastUpdated && (
                                <p className="text-sm text-muted-foreground">
                                    Last Update: {formattedLastUpdated}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className={`grid gap-4 ${gridColsClass}`}>
                    {CITY_CONFIG.map(({ city, timeZone, label }) => (
                        <CityTime
                            key={city}
                            city={label}
                            timeZone={timeZone}
                        />
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gender Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            {isLoading ? (
                                <LogWatcher className="h-[300px]" />
                            ) : (
                                <PieChartComponent />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Character Mass Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <LogWatcher className="h-[300px]" />
                            ) : (
                                <BarChartComponent />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;