import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip} from "recharts";
import {useTheme} from "@/hooks/theme-hooks";
import {useTranslation} from "react-i18next";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {toast} from "sonner";
import {fetchWithRetry} from "@/hooks/use-swapi";
import {LoaderSpinner} from "@/components/layout/loader-spinner.tsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useClickOutside} from "@/hooks/use-click-outside";
import {exportCsv, exportToJson} from "@/utils/export.ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button.tsx";
import {Download} from "lucide-react";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface ChartComponentProps {
    excludedRef: React.RefObject<HTMLDivElement | null>;
}

export interface CharacterMass {
    uid: string;
    name: string;
    mass: number;
    url: string;
}

const fetchTotalRecords = async (): Promise<number> => {
    const url = "https://www.swapi.tech/api/people";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data.total_records;
};

const fetchTotalPages = async (): Promise<number | null> => {
    const url = "https://www.swapi.tech/api/people";

    try {
        const res = await fetch(url);

        if (res.ok) {
            const data = await res.json();
            return data.total_pages ?? null;
        }

        const msg = `Error fetching total_pages: ${res.status} ${res.statusText}`;
        if (res.status === 429) {
            console.warn("Rate limit hit when fetching total_pages");
            return null;
        }
        console.error(msg);
        return null;

    } catch (err) {
        console.error("Error during total_pages fetching:", err);
        return null;
    }
};

const fetchMassDetailsBatch = async (
    characters: { uid: string, name: string, url: string }[],
    delayBetweenBatches: number,
): Promise<{ successfulMasses: CharacterMass[]; failedCount: number }> => {
    const successfulMasses: CharacterMass[] = [];
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
                const mass = data.result.properties.mass;
                const massValue = mass === "unknown" ? -1 : parseFloat(mass.replace(/,/g, ''));
                if (isNaN(massValue)) {
                    return null;
                }
                return {
                    uid: character.uid,
                    name: character.name,
                    mass: massValue,
                    url: character.url
                };
            } catch (err) {
                console.error(`Error parsing JSON for ${character.url} (mass detail):`, err);
                currentFailedCount++;
                return null;
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((r) => {
            if (r.status === "fulfilled" && r.value !== null) {
                successfulMasses.push(r.value);
            } else if (r.status === "rejected") {
                currentFailedCount++;
            }
        });

        if (i + batchSize < characters.length) {
            await sleep(delayBetweenBatches);
        }
    }

    return { successfulMasses, failedCount: currentFailedCount };
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#A020F0", "#FF4500", "#7FFF00", "#DDA0DD"];

interface CustomLabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    percent: number;
    index: number;
    name: string;
}

const CustomLabel = (theme: string, isMobile: boolean, isTablet: boolean) => (props: CustomLabelProps) => {
    const { cx, cy, midAngle, outerRadius, percent, index, name } = props;
    const RADIAN = Math.PI / 180;
    const radiusOffset = isMobile ? 5 : isTablet ? 15 : 20;
    const radius = outerRadius + radiusOffset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const offset = index % 2 === 0 ? -3 : 3;
    const textColor = theme === "dark" ? "#f4f4f5" : "#1f2937";

    return (
        <text
            x={x}
            y={y + offset}
            fill={textColor}
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize={isMobile ? 8 : isTablet ? 10 : 13}
            className="select-none"
        >
            {isMobile && percent < 0.01 ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const useMassData = (page: number, limit: number, t: (key: string, options?: Record<string, string | number>) => string) => {
    return useQuery({
        queryKey: ['massData', page, limit],
        queryFn: async () => {
            const totalPagesFromApi = await fetchTotalPages() ?? 9;

            const url = `https://www.swapi.tech/api/people?page=${page}&limit=${limit}`;
            console.log(`fetching mass page: ${page}, url: ${url}`);
            toast(t("fetchingMassPage", {
                page: page,
                type: t("massTwo"),
                total: totalPagesFromApi,
                limit: limit,
            }));

            const listResponse = await fetchWithRetry(url);
            if (!listResponse) {
                toast.warning(t("errorLoadingMassForPage", { page }));
                throw new Error(`Failed to fetch people list for mass page ${page}`);
            }

            const listJson = await listResponse.json();
            const characters = listJson.results.map((r: { uid: string; name: string; url: string }) => {
                return {
                    uid: r.uid,
                    name: r.name,
                    url: r.url
                };
            });

            const { successfulMasses: massesFromPage, failedCount } = await fetchMassDetailsBatch(characters, 1000);

            if (failedCount > 0) {
                toast.warning(t("failedMassCount", { count: failedCount, page: page }));
            }
            toast.success(t("dataMassLoadedSuccessfully", { page: page }));

            return {
                masses: massesFromPage,
                totalPages: totalPagesFromApi,
                hasFetchedAll: page >= totalPagesFromApi,
                failedCount
            };
        },
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
};

const PieChartComponent = ({excludedRef}: ChartComponentProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState<number | null>(null);
    const [showDataDebug, setShowDataDebug] = useState(false);
    const CHART_FETCH_LIMIT = 10 as const;
    const queryClient = useQueryClient();
    const [accumulatedData, setAccumulatedData] = useState<CharacterMass[]>([]);
    const [processedPages, setProcessedPages] = useState<Set<number>>(new Set());
    const [isInitialized, setIsInitialized] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const debugListRef = useRef<HTMLDivElement>(null);

    useClickOutside(() => {
        if (showDataDebug) {
            setShowDataDebug(false);
        }
    }, [buttonRef, debugListRef], [excludedRef]);

    useEffect(() => {
        const savedCurrentPage = localStorage.getItem('pieChartCurrentPage');
        const savedAccumulatedData = localStorage.getItem('accumulatedMasses');
        const savedProcessedPages = localStorage.getItem('processedPagesPieChart');

        if (savedCurrentPage && savedAccumulatedData && savedProcessedPages) {
            try {
                const parsedCurrentPage = parseInt(savedCurrentPage, 10);
                const parsedAccumulatedData: CharacterMass[] = JSON.parse(savedAccumulatedData);
                const parsedProcessedPagesArray = JSON.parse(savedProcessedPages) as number[];
                const parsedProcessedPages = new Set(parsedProcessedPagesArray);

                const isAccumulatedDataValidMasses = Array.isArray(parsedAccumulatedData) &&
                    parsedAccumulatedData.every(item =>
                        typeof item === 'object' && item !== null &&
                        'uid' in item && typeof item.uid === 'string' &&
                        'name' in item && typeof item.name === 'string' &&
                        'url' in item && typeof item.url === 'string' &&
                        'mass' in item && typeof item.mass === 'number'
                    );

                if (!isAccumulatedDataValidMasses) {
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
        fetchTotalRecords().then(setTotalRecords);
        setIsInitialized(true);
    }, []);


    useEffect(() => {
        if(!isInitialized) return;
        localStorage.setItem('pieChartCurrentPage', currentPage.toString());
        localStorage.setItem('accumulatedMasses', JSON.stringify(accumulatedData));
        localStorage.setItem('processedPagesPieChart', JSON.stringify(Array.from(processedPages)));
    }, [currentPage, accumulatedData, processedPages, isInitialized]);

    useEffect(() => {
        queryClient.setDefaultOptions({
            queries: {
                refetchOnWindowFocus: false,
            },
        });
    }, [queryClient]);

    const {
        data: massData,
        isLoading,
        error: queryError,
        isFetching
    } = useMassData(currentPage, CHART_FETCH_LIMIT, t);

    useEffect(() => {
        console.log(`[EFFECT - PROCESSING DATA] Triggered. currentPage: ${currentPage}, massData present: ${!!massData}, massData.masses length: ${massData?.masses?.length}, processedPages includes currentPage: ${processedPages.has(currentPage)}`);
        if (massData && massData.masses && !processedPages.has(currentPage)) {
            console.log(`Processing page ${currentPage} with ${massData.masses.length} characters`);

            setAccumulatedData(prev => {
                const existingUids = new Set(prev.map(item => item.uid));
                const newData = massData.masses.filter(item => !existingUids.has(item.uid));

                console.log(`Adding ${newData.length} new characters (${massData.masses.length - newData.length} duplicates avoided)`);
                return [...prev, ...newData];
            });

            setProcessedPages(prev => new Set([...prev, currentPage]));
        }
    }, [massData, currentPage, processedPages]);

    const handleExportMassData = useCallback((format: 'csv' | 'json') => {
        const dataToExport = accumulatedData;
        if(dataToExport.length === 0) {
            toast.info(t("noDataToExport"));
            return;
        }
        const filename = `mass_data_page_${currentPage}`;
        if(format === 'csv') {
            exportCsv(dataToExport, filename);
            toast.success(t('exportSuccess', { format: 'CSV', filename: filename }));
        } else {
            exportToJson(dataToExport, filename);
            toast.success(t('exportSuccess', { format: 'JSON', filename: filename }));
        }
    }, [accumulatedData, currentPage, t]);

    const handleFetchNextPage = useCallback(() => {
        if (!isFetching && massData && currentPage <= massData.totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (!isFetching && massData && currentPage > massData.totalPages && massData.totalPages > 0) {
            toast.info(t("noMorePagesToLoad"));
        }
    }, [isFetching, currentPage, massData, t]);

    const handleResetData = useCallback(async () => {
        setCurrentPage(1);
        setAccumulatedData([]);
        setProcessedPages(new Set());
        localStorage.removeItem('pieChartCurrentPage');
        localStorage.removeItem('accumulatedMasses');
        localStorage.removeItem('processedPagesPieChart');
        toast.info(t("resettingAndRefetchingData"));
        console.log("Resetting all data...");
        fetchTotalRecords().then(setTotalRecords);
        try {
            await queryClient.invalidateQueries({ queryKey: ["massData"] });
        } catch (error) {
            console.error("Error during refetch:", error);
        }
    }, [queryClient, t]);

    const massRangeCount = useCallback(() => {
        if (accumulatedData.length === 0) {
            return {};
        }

        const ranges: Record<string, number> = {
            [t("unknownMass")]: 0,
            "0-50 kg": 0,
            "51-100 kg": 0,
            "101-200 kg": 0,
            "201-500 kg": 0,
            "501-1000 kg": 0,
            "> 1000 kg": 0,
        };

        accumulatedData.forEach(item => {
            const mass = item.mass;
            if (mass === -1) {
                ranges[t("unknownMass")]++;
            } else if (mass >= 0 && mass <= 50) {
                ranges["0-50 kg"]++;
            } else if (mass > 50 && mass <= 100) {
                ranges["51-100 kg"]++;
            } else if (mass > 100 && mass <= 200) {
                ranges["101-200 kg"]++;
            } else if (mass > 200 && mass <= 500) {
                ranges["201-500 kg"]++;
            } else if (mass > 500 && mass <= 1000) {
                ranges["501-1000 kg"]++;
            } else if (mass > 1000) {
                ranges["> 1000 kg"]++;
            }
        });

        return Object.fromEntries(
            Object.entries(ranges).filter(([, value]) => value > 0)
        );
    }, [accumulatedData, t]);

    const pieData = useMemo(() => Object.entries(massRangeCount()).map(([name, value]) => ({ name, value })), [massRangeCount]);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const checkScreenSize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const width = window.innerWidth;
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

    const outerRadius = isMobile ? 45 : isTablet ? 85 : 120;
    const chartHeight = isMobile ? 220 : isTablet ? 370 : 420;

    const allPagesFetched = processedPages.size > 0 && massData?.totalPages && processedPages.size >= massData.totalPages;

    if (queryError) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px] text-red-600">
                <p>{t("errorFetchingMassData")}</p>
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

    if (pieData.length === 0 && !isLoading && !isFetching && accumulatedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px] p-4 text-center">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-700 dark:text-gray-300 mb-6">
                {t("noMassDataAvailable")}
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
                <p className="mt-10"><strong>{t("loadedRecords")}: {accumulatedData.length}</strong></p>
                <p className="mt-2"><strong>{t("currentPage")}: {currentPage} {t("of")} {massData?.totalPages || '9'}</strong></p>
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
                <div ref={debugListRef} className="mb-4 p-4 bg-gray-100 dark:bg-black text-xs max-h-40 overflow-y-auto rounded-lg shadow">
                    <h4 className="font-bold mb-2">{t("accumulatedData", {accumulated: accumulatedData.length})}</h4>
                    {accumulatedData.map((item, index) => (
                        <div key={item.uid} className="mb-1">
                            {index + 1}. {item.name} (UID: {item.uid}) - {item.mass === -1 ? 'unknown' : `${item.mass}kg`}
                        </div>
                    ))}
                </div>
            )}
            <div className="flex flex-col items-center md:flex-row sm:justify-center gap-2 mt-4 sm:mt-0">
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={() => handleExportMassData('csv')}
                            variant="ghost"
                            disabled={accumulatedData.length === 0}
                            className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                       h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                       sm:h-10 sm:px-4 sm:py-2 text-xs text-center
                                                       w-[120px] sm:w-[140px] lg:w-[150px] lg:text-sm"
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
                            onClick={() => handleExportMassData('json')}
                            variant="ghost"
                            disabled={accumulatedData.length === 0}
                            className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                       h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                       sm:h-10 sm:px-4 sm:py-2 lg:text-sm text-xs text-center
                                                       w-[120px] sm:w-[140px] lg:w-[150px]"
                        >
                            <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {isMobile ? "JSON" : t("exportToJson")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} className="whitespace-nowrap max-w-md rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
                        <p>{t('tooltipExportToJson', { page: currentPage })}</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <ResponsiveContainer width="100%" height={chartHeight}>
                <PieChart margin={{ top: 15, right: 15, bottom: 25, left: 15 }}>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={outerRadius}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={CustomLabel(theme, isMobile, isTablet)}
                    >
                        {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <RechartsTooltip
                        contentStyle={{
                            fontSize: isMobile ? '12px' : '14px',
                            padding: isMobile ? '4px 8px' : '8px 12px'
                        }}
                    />
                    <Legend
                        wrapperStyle={{
                            fontSize: isMobile ? '10px' : isTablet ? '11px' : '13px',
                            paddingTop: isMobile ? '5px' : '10px'
                        }}
                        iconSize={isMobile ? 8 : isTablet ? 9 : 11}
                    />
                </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-4">
                {(isLoading || isFetching) ? (
                    <span className="text-center text-sm text-gray-500">
                        {t("fetchingMassPage", {
                            page: currentPage,
                            total: massData?.totalPages || 9,
                            type: t("massTwo"),
                            limit: CHART_FETCH_LIMIT
                        })}
                    </span>
                ) : (
                    <>
                        {!allPagesFetched && massData && currentPage < massData.totalPages && (
                            <button
                                onClick={handleFetchNextPage}
                                className="hover:scale-[0.98] active:scale-[0.98] font-semibold cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-muted text-foreground text-sm font-medium px-4 py-2 shadow-sm hover:bg-muted/70 hover:text-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || isFetching}
                            >
                                {t("fetchNextPage", {
                                    page: currentPage + 1,
                                    total: massData?.totalPages || 9
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
                    {t("resetAndRefetchMassData")}
                </button>
            </div>
        </div>
    );
};

export default PieChartComponent;