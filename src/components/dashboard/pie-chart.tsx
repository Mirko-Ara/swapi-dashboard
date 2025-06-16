import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "@/providers/theme-hooks";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { fetchWithRetry } from "@/hooks/use-swapi";
import { LoaderSpinner } from "@/components/layout/loader-spinner.tsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
    urls: string[],
    delayBetweenBatches: number,
): Promise<{ successfulMasses: number[]; failedCount: number }> => {
    const successfulMasses: number[] = [];
    let currentFailedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < urls.length; i += batchSize) {
        const batchUrls = urls.slice(i, i + batchSize);
        const batchPromises = batchUrls.map(async (url) => {
            const res = await fetchWithRetry(url);
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
                return { mass: massValue };
            } catch (err) {
                console.error(`Error parsing JSON for ${url} (mass detail):`, err);
                currentFailedCount++;
                return null;
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((r) => {
            if (r.status === "fulfilled" && r.value !== null) {
                successfulMasses.push(r.value.mass);
            } else if (r.status === "rejected") {
                currentFailedCount++;
            }
        });

        if (i + batchSize < urls.length) {
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
                type: t("mass"),
                total: totalPagesFromApi,
                limit: limit,
            }));

            const listResponse = await fetchWithRetry(url);
            if (!listResponse) {
                toast.warning(t("errorLoadingMassForPage", { page }));
                throw new Error(`Failed to fetch people list for mass page ${page}`);
            }

            const listJson = await listResponse.json();
            const characterUrls = listJson.results.map((r: { url: string }) => r.url);

            const { successfulMasses: massesFromPage, failedCount } = await fetchMassDetailsBatch(characterUrls, 1000);

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
        placeholderData: (prevData) => prevData,
    });
};

const PieChartComponent = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [currentPage, setCurrentPage] = useState(() => {
        const savedPage = localStorage.getItem('pieChartCurrentPage');
        return savedPage ? parseInt(savedPage, 10) : 1;
    });
    const [totalRecords, setTotalRecords] = useState<number | null>(null);
    const CHART_FETCH_LIMIT = 10 as const;
    const queryClient = useQueryClient();

    const [accumulatedMasses, setAccumulatedMasses] = useState<number[]>(() => {
        const saved = localStorage.getItem('accumulatedMasses');
        return saved ? JSON.parse(saved) : [];
    });
    const massSet = useRef<Set<number>>(new Set(accumulatedMasses));
    const hasFetchedAllPages = useRef(false);
    const processedPages = useRef<Set<number>>(
        new Set(JSON.parse(localStorage.getItem('processedPages') || '[]'))
    );

    useEffect(() => {
        queryClient.setDefaultOptions({
            queries: {
                refetchOnWindowFocus: false,
            },
        });
    }, [queryClient]);

    useEffect(() => {
        localStorage.setItem('pieChartCurrentPage', currentPage.toString());
    }, [currentPage]);

    useEffect(() => {
        fetchTotalRecords().then(setTotalRecords);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (accumulatedMasses.length > 0) {
                localStorage.setItem('accumulatedMasses', JSON.stringify(accumulatedMasses));
                localStorage.setItem('processedPages', JSON.stringify([...processedPages.current]));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [accumulatedMasses]);

    const {
        data: massData,
        isLoading,
        error: queryError,
        isFetching
    } = useMassData(currentPage, CHART_FETCH_LIMIT, t);

    useEffect(() => {
        if (massData && !processedPages.current.has(currentPage)) {
            setAccumulatedMasses(prev => {
                const newMasses = massData.masses.filter(mass => !massSet.current.has(mass));

                if (newMasses.length > 0) {
                    newMasses.forEach(mass => massSet.current.add(mass));
                    processedPages.current.add(currentPage);
                    return [...prev, ...newMasses];
                }
                return prev;
            });
            hasFetchedAllPages.current = massData.hasFetchedAll;
        }
    }, [massData, currentPage]);

    const handleFetchNextPage = useCallback(() => {
        if (!isFetching && massData && currentPage < massData.totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (!isFetching && massData && currentPage >= massData.totalPages && massData.totalPages > 0) {
            toast.info(t("noMorePagesToLoad"));
        }
    }, [isFetching, currentPage, massData, t]);

    const handleResetData = useCallback(() => {
        queryClient.removeQueries({ queryKey: ['massData'] });
        setCurrentPage(1);
        setAccumulatedMasses([]);
        massSet.current = new Set();
        processedPages.current = new Set();
        localStorage.removeItem('accumulatedMasses');
        localStorage.removeItem('processedPages');
        fetchTotalRecords().then(setTotalRecords);
        toast.info(t("resettingAndRefetchingData"));
    }, [queryClient, t]);

    const massRangeCount = useCallback(() => {
        if (accumulatedMasses.length === 0) {
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

        accumulatedMasses.forEach(mass => {
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
    }, [accumulatedMasses, t]);

    const pieData = useMemo(() => Object.entries(massRangeCount()).map(([name, value]) => ({ name, value })), [massRangeCount]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

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

    if (queryError) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px] text-red-600">
                <p>{t("errorFetchingMassData")}</p>
                <button
                    onClick={handleResetData}
                    className="group mt-4 px-4 py-2 rounded-2xl cursor-pointer bg-dark-600 text-white hover:shadow-lg hover:bg-dark-500 transition-shadow duration-200"
                >
                    {t("retryLoadingData")}
                </button>
            </div>
        );
    }

    if ((isLoading || isFetching) && accumulatedMasses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px]">
                <LoaderSpinner size="xl" />
                <button
                    onClick={handleResetData}
                    className="group mt-4 px-4 py-2 rounded-2xl cursor-pointer bg-dark-600 text-white hover:shadow-lg hover:bg-dark-500 transition-shadow duration-200"
                    disabled={isLoading || isFetching}
                >
                    {t("resetAndRefetch")}
                </button>
            </div>
        );
    }

    if (pieData.length === 0 && !isLoading && !isFetching && accumulatedMasses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px]">
                <span className="text-xs sm:text-sm md:text-md lg:text-lg text-shadow">{t("noMassDataAvailable")}</span>
                <button
                    onClick={handleResetData}
                    className="group mt-4 px-4 py-2 rounded-2xl cursor-pointer bg-dark-600 text-white hover:shadow-lg hover:bg-dark-500 transition-shadow duration-200"
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
                <p>{t("totalRecordsForCharts")}: {totalRecords || 'loading...'}</p>
                <p>{t("loadedRecords")}: {accumulatedMasses.length}</p>
                <p>{t("currentPage")}: {currentPage}/{massData?.totalPages || '?'}</p>
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
                    <Tooltip
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
                            total: massData?.totalPages || 0,
                            type: t("mass"),
                            limit: CHART_FETCH_LIMIT
                        })}
                    </span>
                ) : (
                    <>
                        {!hasFetchedAllPages.current && massData && currentPage < massData.totalPages && (
                            <button
                                onClick={handleFetchNextPage}
                                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-muted text-foreground text-sm font-medium px-4 py-2 shadow-sm hover:bg-muted/70 hover:text-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || isFetching || (massData ? currentPage >= massData.totalPages : true) || (totalRecords !== null && accumulatedMasses.length >= totalRecords)}
                            >
                                {t("fetchNextPage", {
                                    page: currentPage + 1,
                                    total: massData?.totalPages || 0
                                })}
                            </button>
                        )}
                        {hasFetchedAllPages.current && massData?.totalPages && massData.totalPages > 0 && (
                            <span className="text-center text-sm text-gray-500">
                                {t("allMassDataLoaded", {
                                    totalRecords: accumulatedMasses.length
                                })}
                            </span>
                        )}
                    </>
                )}

                <button
                    onClick={handleResetData}
                    className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-muted/70 text-foreground text-sm font-medium px-4 py-2 shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(isLoading || isFetching) && accumulatedMasses.length === 0}
                >
                    {t("resetAndRefetchMassData")}
                </button>
            </div>
        </div>
    );
};

export default PieChartComponent;