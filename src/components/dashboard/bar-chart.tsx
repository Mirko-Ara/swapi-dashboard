import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from "react-i18next";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { toast } from "sonner";
import { fetchWithRetry } from "@/hooks/use-swapi";
import { LoaderSpinner } from "@/components/layout/loader-spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme} from "@/hooks/theme-hooks";
import { useClickOutside} from "@/hooks/use-click-outside";
import type { ChartComponentProps} from "@/components/dashboard/pie-chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button.tsx";
import {Download} from "lucide-react";
import {exportCsv, exportToJson} from "@/utils/export.ts";

export interface CharacterGender {
    uid: string;
    name: string;
    gender: string;
    url: string;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const fetchTotalRecordsPeople = async (): Promise<number> => {
    try {
        const response = await fetch("https://www.swapi.tech/api/people");

        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }

        const json = await response.json();

        return json.total_records;
    } catch (error) {
        console.error("Error fetching total records for people:", error);
        throw error;
    }
};


const fetchTotalPages = async (): Promise<number | null> => {
    const endpoint = "https://www.swapi.tech/api/people";

    try {
        const response = await fetch(endpoint);

        if (!response.ok) {
            const errorMsg = `Error fetching total_pages: ${response.status} ${response.statusText}`;

            if (response.status === 429) {
                console.warn("Rate limit reached while fetching total_pages.");
                return null;
            }

            console.error(errorMsg);
            return null;
        }

        const json = await response.json();
        return json.total_pages ?? null;

    } catch (error) {
        console.error("Network or parsing error while fetching total_pages:", error);
        return null;
    }
};


const fetchGenderDetailsBatch = async (
    characters: { uid: string, name: string, url: string }[],
    delayBetweenBatches: number,
): Promise<{ successfulGenders: CharacterGender[]; failedCount: number }> => {
    const successfulGenders: CharacterGender[] = [];
    let currentFailedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < characters.length; i += batchSize) {
        const batchUrls = characters.slice(i, i + batchSize);
        const batchPromises = batchUrls.map(async (character) => {
            const res = await fetchWithRetry(character.url);
            if (!res) {
                return null;
            }
            try {
                const data = await res.json();
                const gender = data.result.properties.gender?.toLowerCase() || 'unknown';
                return {
                    uid: character.uid,
                    name: character.name,
                    gender: gender,
                    url: character.url
                };
            } catch (err) {
                console.error(`Error parsing JSON for ${character.url} (gender detail):`, err);
                currentFailedCount++;
                return null;
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((r) => {
            if (r.status === "fulfilled" && r.value !== null) {
                successfulGenders.push(r.value);
            } else if (r.status === "rejected") {
                currentFailedCount++;
            }
        });

        if (i + batchSize < characters.length) {
            await sleep(delayBetweenBatches);
        }
    }

    return { successfulGenders, failedCount: currentFailedCount };
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#A020F0", "#FF4500", "#7FFF00", "#DDA0DD"];

const useGenderData = (page: number, limit: number, t: (key: string, options?: Record<string, string | number>) => string) => {
    return useQuery({
        queryKey: ['genderData', page, limit],
        queryFn: async () => {
            const totalPagesFromApi = await fetchTotalPages() ?? 9;

            const url = `https://www.swapi.tech/api/people?page=${page}&limit=${limit}`;
            console.log(`fetching gender page: ${page}, url: ${url}`);
            toast(t("fetchingGenderPage", {
                page: page,
                type: t("gender"),
                total: totalPagesFromApi,
                limit: limit,
            }));

            const listResponse = await fetchWithRetry(url);
            if (!listResponse) {
                toast.warning(t("errorLoadingGenderForPage", { page }));
                throw new Error(`Failed to fetch people list for gender page ${page}`);
            }

            const listJson = await listResponse.json();
            const characters = listJson.results.map((r: { uid: string; name: string; url: string }) => {
                return {
                    uid: r.uid,
                    name: r.name,
                    url: r.url
                };
            });

            const { successfulGenders: gendersFromPage, failedCount } = await fetchGenderDetailsBatch(characters, 1000);

            if (failedCount > 0) {
                toast.warning(t("failedGenderCount", { count: failedCount, page: page }));
            }
            toast.success(t("dataGenderLoadedSuccessfully", { page: page }));

            return {
                genders: gendersFromPage,
                totalPages: totalPagesFromApi,
                hasFetchedAll: page >= totalPagesFromApi,
                failedCount
            };
        },
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
};

const BarChartComponent = ({excludedRef}: ChartComponentProps) => {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isSmallMobile, setIsSmallMobile] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState<number | null>(null);
    const [showDataDebug, setShowDataDebug] = useState(false);
    const CHART_FETCH_LIMIT = 10 as const;
    const queryClient = useQueryClient();
    const [accumulatedData, setAccumulatedData] = useState<CharacterGender[]>([]);
    const [processedPages, setProcessedPages] = useState<Set<number>>(new Set());
    const [isInitialized, setIsInitialized] = useState(false);
    const { theme } = useTheme();
    const [totalPages, setTotalPages] = useState<number>(0);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const debugListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadTotalPages = async () => {
            try {
                const pages = await fetchTotalPages();
                setTotalPages(pages ?? 9);
            } catch(error) {
                console.error("Error fetching total pages for Bar Chart:", error);
                setTotalPages(9); // Fallback to default value
            }
        };
        loadTotalPages().catch((error) => console.error("Error fetching total pages", error));
    }, []);

    useClickOutside(() => {
        if (showDataDebug) {
            setShowDataDebug(false);
        }
    }, [buttonRef, debugListRef], [excludedRef]);

    useEffect(() => {
        const savedCurrentPage = localStorage.getItem('barChartCurrentPage');
        const savedAccumulatedData = localStorage.getItem('accumulatedGenders');
        const savedProcessedPages = localStorage.getItem('processedPagesBarChart');

        if (savedCurrentPage && savedAccumulatedData && savedProcessedPages) {
            try {
                const parsedCurrentPage = parseInt(savedCurrentPage, 10);
                const parsedAccumulatedData: CharacterGender[] = JSON.parse(savedAccumulatedData);
                const parsedProcessedPagesArray = JSON.parse(savedProcessedPages) as number[];
                const parsedProcessedPages = new Set(parsedProcessedPagesArray);

                const isAccumulatedDataValid = Array.isArray(parsedAccumulatedData) &&
                    parsedAccumulatedData.every(item =>
                        typeof item === 'object' && item !== null &&
                        'uid' in item && typeof item.uid === 'string' &&
                        'name' in item && typeof item.name === 'string' &&
                        'url' in item && typeof item.url === 'string' &&
                        'gender' in item && typeof item.gender === 'string'
                    );

                if (!isAccumulatedDataValid) {
                    console.warn("Invalid or corrupt data found in localStorage. Starting fresh.");
                    setCurrentPage(1);
                    setAccumulatedData([]);
                    setProcessedPages(new Set());
                } else {
                    const maxProcessedPage = Math.max(...parsedProcessedPagesArray, 1);
                    const pageToSet = parsedCurrentPage < maxProcessedPage ? maxProcessedPage : parsedCurrentPage;
                    setCurrentPage(pageToSet);
                    setAccumulatedData(parsedAccumulatedData);
                    setProcessedPages(parsedProcessedPages);
                    console.log("Loaded data from localStorage", pageToSet, parsedAccumulatedData.length, parsedProcessedPages.size);
                }
            } catch (e) {
                console.error("Failed to parse localStorage data, starting fresh.", e);
                setCurrentPage(1);
                setAccumulatedData([]);
                setProcessedPages(new Set());
            }
        } else {
            setCurrentPage(1);
            setAccumulatedData([]);
            setProcessedPages(new Set());
            console.log("No saved data found, starting fresh.");
        }
        fetchTotalRecordsPeople().then(setTotalRecords);
        setIsInitialized(true);
    }, []);



    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('barChartCurrentPage', currentPage.toString());
        localStorage.setItem('accumulatedGenders', JSON.stringify(accumulatedData));
        localStorage.setItem('processedPagesBarChart', JSON.stringify(Array.from(processedPages)));
    }, [currentPage, accumulatedData, processedPages, isInitialized]);


    useEffect(() => {
        queryClient.setDefaultOptions({
            queries: {
                refetchOnWindowFocus: false,
            },
        });
    }, [queryClient]);

    const {
        data: genderData,
        isLoading,
        error: queryError,
        isFetching
    } = useGenderData(currentPage, CHART_FETCH_LIMIT, t);

    useEffect(() => {
        if (genderData && genderData.genders && !processedPages.has(currentPage)) {
            setAccumulatedData(prev => {
                const existingUids = new Set(prev.map(item => item.uid));
                const newData = genderData.genders.filter(item => !existingUids.has(item.uid));
                return [...prev, ...newData];
            });

            setProcessedPages(prev => new Set([...prev, currentPage]));
        }
    }, [genderData, currentPage, processedPages]);

    const handleExportGenderData = useCallback((format: 'csv' | 'json') => {
        const dataGenderToExport = accumulatedData;
        if(dataGenderToExport.length === 0) {
            toast.info(t("noDataToExport"));
            return;
        }
        const filename = `gender_data_page_${currentPage}`;
        if(format === 'csv') {
            exportCsv(dataGenderToExport, filename);
            toast.success(t('exportSuccess', { format: 'CSV', filename: filename }));
        } else {
            exportToJson(dataGenderToExport, filename);
            toast.success(t('exportSuccess', { format: 'JSON', filename: filename }));
        }
    }, [accumulatedData, currentPage, t]);

    const handleFetchNextPage = useCallback(() => {
        if (!isFetching && genderData && currentPage <= (genderData.totalPages || 9)) {
            setCurrentPage(prev => prev + 1);
        } else if (!isFetching && genderData && currentPage > (genderData.totalPages || 9) && (genderData.totalPages || 9) > 0) {
            toast.info(t("noMorePagesToLoad"));
        }
    }, [isFetching, currentPage, genderData, t]);

    const handleResetData = useCallback(async () => {
        setCurrentPage(1);
        setAccumulatedData([]);
        setProcessedPages(new Set());
        localStorage.removeItem('barChartCurrentPage');
        localStorage.removeItem('accumulatedGenders');
        localStorage.removeItem('processedPagesBarChart');
        toast.info(t("resettingAndRefetchingData"));
        console.log("Resetting all data for Bar Chart...");
        fetchTotalRecordsPeople().then(setTotalRecords);
        try {
            await queryClient.invalidateQueries({ queryKey: ["genderData"] });
        } catch (error) {
            console.error("Error during refetch for Bar Chart:", error);
        }
    }, [queryClient, t]);

    const genderCount = useCallback(() => {
        if (accumulatedData.length === 0) {
            return {};
        }

        const counts: Record<string, number> = {
            male: 0,
            female: 0,
            hermaphrodite: 0,
            none: 0,
            unknown: 0,
            'n/a': 0
        };

        accumulatedData.forEach(item => {
            const normalizedGender = item.gender?.toLowerCase() || 'unknown';
            if (Object.prototype.hasOwnProperty.call(counts, normalizedGender)) {
                counts[normalizedGender]++;
            } else {
                counts.unknown++;
            }
        });

        const filteredCounts: Record<string, number> = Object.fromEntries(
            Object.entries(counts).filter(([, value]) => value > 0)
        );

        const translatedCounts: Record<string, number> = {};
        Object.entries(filteredCounts).forEach(([key, value]) => {
            translatedCounts[t(`genderTwo.${key}`)] = value;
        });

        return translatedCounts;
    }, [accumulatedData, t]);

    const barData = useMemo(() => {
        const counts = genderCount();
        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            fill: COLORS[Object.keys(counts).indexOf(name) % COLORS.length]
        }));
    }, [genderCount]);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const checkScreenSize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const width = window.innerWidth;
                setIsSmallMobile(width < 480);
                setIsMobile(width < 640);
                setIsTablet(width >= 640 && width < 1024);
            }, 100);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => {
            window.removeEventListener('resize', checkScreenSize);
            clearTimeout(timeoutId);
        };
    }, []);

    const chartHeight = isMobile ? 250 : isTablet ? 300 : 350;
    const bottomMargin = isMobile ? 30 : isTablet ? 40 : 50;
    const fontSize = isSmallMobile ? 9 : isMobile ? 10 : isTablet ? 11 : 12;


    const allPagesFetched = processedPages.size > 0 && genderData?.totalPages && processedPages.size >= genderData.totalPages;


    if (queryError) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px] text-red-600">
                <p>{t("errorFetchingGenderData")}</p>
                <button
                    onClick={handleResetData}
                    className="group mt-4 px-4 py-2 rounded-2xl cursor-pointer text-white hover:scale-[0.98] active:scale-[0.98] hover:bg-dark-500 transition-shadow duration-200 border-2"
                >
                    {t("retryLoadingData")}
                </button>
            </div>
        );
    }

    if ((isLoading || isFetching) && accumulatedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px] gap-5">
                <LoaderSpinner size="xl" />
                <p>{t("loadingData")}</p>
            </div>
        );
    }

    if (barData.length === 0 && !isLoading && !isFetching && accumulatedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px] p-4 text-center">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-700 dark:text-gray-300 mb-6">
                {t("noGenderDataAvailable")}
            </span>
                <button
                    onClick={handleResetData}
                    className="
                    inline-flex items-center justify-center
                    px-6 py-3
                    rounded-full
                    shadow-md hover:shadow-lg
                    transition-all duration-300 ease-in-out
                    bg-blue-600 text-white
                    hover:bg-blue-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    font-semibold text-base
                "
                    disabled={isLoading || isFetching}
                >
                    {t("resetAndRefetch")}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="text-center mb-4">
                <p className="mt-3"><strong>{t("loadedRecords")}: {accumulatedData.length}</strong></p>
                <p className="mt-2"><strong>{t("currentPage")}: {currentPage} {t("of")} {genderData?.totalPages || totalPages}</strong></p>
                <button
                    ref={buttonRef}
                    onClick={() => setShowDataDebug(!showDataDebug)}
                    className="cursor-pointer
                        transition-transform hover:scale-95 active:scale-90
                        text-xs sm:text-sm md:text-base rounded-lg
                        px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 mt-4"
                >
                    {showDataDebug ? t("hideDebugData") : t("showDebugData")}
                </button>
            </div>

            {showDataDebug && (
                <div
                    ref={debugListRef}
                    className="mb-4 p-4 bg-gray-100 dark:bg-black text-xs max-h-40 overflow-y-auto rounded-lg shadow"
                >
                    <h4 className="font-bold mb-2">{t("accumulatedData", {accumulated: accumulatedData.length})}</h4>
                    {accumulatedData.map((item, index) => (
                        <div key={item.uid} className="mb-1">
                            {index + 1}. {item.name} (UID: {item.uid}) - {item.gender === 'unknown' ? 'unknown' : item.gender}
                        </div>
                    ))}
                </div>
            )}
            <div className="flex flex-col items-center md:flex-row sm:justify-center gap-2 mt-4 sm:mt-0">
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={() => handleExportGenderData('csv')}
                            variant="ghost"
                            disabled={accumulatedData.length === 0}
                            className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                       h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                       sm:h-10 sm:px-4 sm:py-2 lg:text-sm text-xs
                                                       text-center w-[120px] sm:w-[140px] lg:w-[150px]]"
                        >
                            <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {isMobile ? "CSV" : t("exportToCSV")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={isTablet ? "top" : "bottom"} sideOffset={8} className="whitespace-nowrap max-w-md rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
                        <p>{t('tooltipExportToCsv', { page: currentPage })}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={() => handleExportGenderData('json')}
                            variant="ghost"
                            disabled={accumulatedData.length === 0}
                            className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                       h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                       sm:h-10 sm:px-4 sm:py-2 lg:text-sm text-xs
                                                       text-center w-[120px] sm:w-[140px] lg:w-[150px]"
                        >
                            <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {isMobile ? "JSON" : t("exportToJson")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} className="whitespace-nowrap max-w-md rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
                        <p>{t('tooltipExportToJson', { page: currentPage })}</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <ResponsiveContainer width="100%" height={chartHeight} className="mt-17">
                <BarChart
                    data={barData}
                    margin={{
                        top: 5,
                        right: isMobile ? 10 : isTablet ? 20 : 30,
                        left: isMobile ? 10 : isTablet ? 15 : 20,
                        bottom: bottomMargin,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? "end" : "middle"}
                        height={isMobile ? 70 : 50}
                        tick={{ fontSize }}
                    />
                    <YAxis
                        label={{
                            value: t("count"),
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize }

                        }}
                        tick={{ fontSize }}
                    />
                    <RechartsTooltip
                        formatter={(value) => [`${value}`, t("characters")]}
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            borderColor: theme === 'dark' ? "#ccc" : '#444',
                            fontSize: isMobile ? '11px' : isTablet ? '12px' : '13px',
                            padding: isMobile ? '4px 6px' : isTablet ? '5px 7px' : '6px 8px'
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        height={isMobile ? 30 : isTablet ? 33 : 36}
                        wrapperStyle={{ fontSize: isMobile ? '10px' : '12px'}}
                    />
                    <Bar
                        dataKey="value"
                        name={t("genderDistribution")}
                        radius={isMobile ? [2, 2, 0, 0] : isTablet ? [3, 3, 0, 0] : [4, 4, 0, 0]}
                    >
                        {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-4">
                {(isLoading || isFetching) ? (
                    <span className="text-center text-sm text-gray-500">
                        {t("fetchingGenderPage", {
                            page: currentPage,
                            total: genderData?.totalPages || 9,
                            type: t("gender"),
                            limit: CHART_FETCH_LIMIT
                        })}
                    </span>
                ) : (
                    <>
                        {!allPagesFetched && genderData && currentPage < (genderData.totalPages || totalPages) && (
                            <button
                                onClick={handleFetchNextPage}
                                className="hover:scale-[0.98] active:scale-[0.98] font-semibold cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-muted text-foreground text-sm font-medium px-4 py-2 shadow-sm hover:bg-muted/70 hover:text-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || isFetching}
                            >
                                {t("fetchNextPage", {
                                    page: currentPage + 1,
                                    total: genderData?.totalPages || totalPages,
                                })}
                            </button>
                        )}
                        {allPagesFetched && (
                            <span className="text-center text-sm font-medium">
                                {accumulatedData.length === totalRecords ? <span className="text-green-600">{t("allDataFetched", {dataFetched: accumulatedData.length})}</span> : <span className="text-red-500">{t("notAllDataFetched", {dataFetched: accumulatedData.length})}</span>}
                            </span>
                        )}
                    </>
                )}

                <button
                    onClick={handleResetData}
                    className="hover:scale-[0.98] active:scale-[0.98] text-foreground font-semibold cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-muted/70 text-sm font-medium px-4 py-2 shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(isLoading || isFetching)}
                >
                    {t("resetAndRefetchGenderData")}
                </button>
            </div>
        </div>
    );
};

export default BarChartComponent;