import { useSwapiStarships } from "@/hooks/use-swapi-starships";
import { StarshipsTable } from "@/components/starships/starships-table";
import { LogWatcher } from "@/components/layout/log-watcher";
import { useTranslation } from 'react-i18next';
import type { Starship } from "@/types";
import {useCallback, useMemo, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {RotateCcw} from "lucide-react";
import {useQueryClient} from "@tanstack/react-query";
import i18n from "i18next";
import { useStarshipsLogWatcher } from '@/context/log-watcher-instances';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const formatNumberForDisplay = (value: string | number | undefined | null, locale: string): string => {
    if(value === null || value === undefined || value === "n/a" || value === "unknown" || value === "none") {
        return "unknown";
    }
    const num = parseFloat(String(value).replace(/,/g, ''));
    if(isNaN(num)) {
        return String(value);
    }
    return new Intl.NumberFormat(locale).format(num);
};

export const Starships = () => {
    const currentLocale = i18n.language || 'en-US';
    const { data, isLoading, isRefetching, expectedTotalStarships, isLoadingTotalRecords } = useSwapiStarships();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isProcessingRefetch, setIsProcessingRefetch] = useState(false);


    const shouldStarshipShowRefetchButton = useMemo(() => {
        return !isLoading &&  !isRefetching && data !== undefined && expectedTotalStarships !== undefined && !isLoadingTotalRecords;
    }, [data, isLoading, isRefetching, expectedTotalStarships, isLoadingTotalRecords]);

    const handleRefetch = useCallback(async () => {
        setIsProcessingRefetch(true);
        try {
            queryClient.removeQueries({ queryKey: ["swapi-starships"] });
            queryClient.removeQueries({ queryKey: ["swapi-starships-total-records"] });
            queryClient.removeQueries({ queryKey: ['swapi-info-starships-extra'], exact: false });
            await queryClient.invalidateQueries({ queryKey: ["swapi-starships"] });
            await queryClient.fetchQuery({ queryKey: ["swapi-starships"] });
        } catch (error) {
            console.error("Error during refetching starships data:", error);
        } finally {
            setTimeout(() => {
                setIsProcessingRefetch(false);
                console.clear();
            }, 500);
        }
    }, [queryClient]);

    const newData: Starship[] = useMemo(() => {
        const processedData: Starship[] = [];
        if (data !== undefined && !isLoading) {
            data.forEach((starship: Starship) => {
                const formattedPassengers = formatNumberForDisplay(starship.passengers, currentLocale);
                const passengers = formattedPassengers === "unknown" ? t("unknown") : formattedPassengers;

                const formattedCargoCapacity = formatNumberForDisplay(starship.cargo_capacity, currentLocale);
                const cargoCapacity = formattedCargoCapacity === "unknown" ? t("unknown") : `${formattedCargoCapacity} kg`;

                let maxAtmospheringSpeed = starship.max_atmosphering_speed;
                if (maxAtmospheringSpeed === "1000km") {
                    maxAtmospheringSpeed = "1000 km/h";
                } else if (maxAtmospheringSpeed === "n/a" || maxAtmospheringSpeed === "unknown") {
                    maxAtmospheringSpeed = t("unknown");
                } else {
                    maxAtmospheringSpeed = `${formatNumberForDisplay(starship.max_atmosphering_speed, currentLocale)} km/h`;
                }

                processedData.push({
                    ...starship,
                    passengers: passengers,
                    cargo_capacity: cargoCapacity,
                    pilots: starship.pilots,
                    max_atmosphering_speed: maxAtmospheringSpeed,
                });
            });
        }
        return processedData;
    }, [data, isLoading, t, currentLocale]); // Dependencies for useMemo

    return (
        <div className="flex flex-col p-8 pt-6 space-y-6 w-full h-full">
            <div className="flex justify-center items-center">
                <h2 className="text-3xl font-bold tracking-tight text-center">
                    {t('starshipsPageTitle')}
                </h2>
            </div>

            {isLoading || isProcessingRefetch ? (
                <LogWatcher className="h-[300px]" useWatcherHook={useStarshipsLogWatcher}/>
            ) : (
                <>
                    <StarshipsTable data={newData || []} />
                    {shouldStarshipShowRefetchButton && (
                        <div className="mt-6 text-center">
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <Button
                                    onClick={handleRefetch}
                                    className="cursor-pointer font-semibold hover:scale-[0.98] active:scale-[0.96] transistion-transform text-sm sm:text-base"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> {t("refetchData")}
                                    </Button>
                                </TooltipTrigger>
                                    <p className="text-sm font-semibold text-gray-500 mt-2">
                                        {t("totalRecords", {count: data?.length || 0, total: expectedTotalStarships })}
                                    </p>
                                <TooltipContent side="top" sideOffset={8} className="rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-xs">
                                    <p>{t("refetchDataTooltip")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};