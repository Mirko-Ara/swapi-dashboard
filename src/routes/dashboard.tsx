import { CityTime } from '../components/dashboard/city-time'
import PieChartComponent from '../components/dashboard/pie-chart'
import BarChartComponent from '../components/dashboard/bar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useSwapiPeople } from '../hooks/use-swapi'
import { Button } from "@/components/ui/button"
import { useQueryClient } from '@tanstack/react-query'
import { LogWatcher } from '@/components/layout/log-watcher';
import { useLogWatcher } from '@/context/loader-watcher-context';
const Dashboard = () => {
    const { isLoading, refetch} = useSwapiPeople();
    const queryClient = useQueryClient();
    const { setCurrentPage, setFetchingMessage } = useLogWatcher();

    const handleInvalidateCache = async (): Promise<void> => {
        queryClient.removeQueries({ queryKey: ["swapi-people"] });
        localStorage.removeItem("swapi-people-data");
        localStorage.removeItem("swapi-people-timestamp");
        console.clear();
        setCurrentPage(null);
        setFetchingMessage("Loading data...")
        await refetch();
    };

    const hasCache = queryClient.getQueryData(["swapi-people"]) !== undefined;
    return (
        <div className="flex flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">SWAPI Dashboard</h2>
                    {hasCache && (
                        <Button
                            variant="outline"
                            onClick={handleInvalidateCache}
                            className="cursor-pointer hover:scale-[0.98] active:scale-[0.96] transition-transform"
                        >
                            Invalidate Cache
                        </Button>)}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <CityTime city="London" timeZone="Europe/London" />
                    <CityTime city="New York" timeZone="America/New_York" />
                    <CityTime city="Tokyo" timeZone="Asia/Tokyo" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
    )
}

export default Dashboard