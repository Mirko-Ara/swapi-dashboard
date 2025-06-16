import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell} from 'recharts';
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { fetchWithRetry } from "@/hooks/use-swapi";
import { LoaderSpinner } from "@/components/layout/loader-spinner.tsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const fetchTotalRecords = async (): Promise<number> => {
    const url = "https://www.swapi.tech/api/people";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data.total_records;
};

const sleepTime = (ms: number) => new Promise((res) => setTimeout(res, ms));

const fetchGenderDetailsBatch = async (
    urls: string[],
    delayBetweenBatches: number,
): Promise<{ successfulGenders: string[]; failedCount: number }> => {
    const successfulGenders: string[] = [];
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
                const gender = data.result.properties.gender?.toLowerCase() || 'unknown';
                return { gender };
            } catch (err) {
                console.error(`Error parsing JSON for ${url} (gender detail):`, err);
                currentFailedCount++;
                return null;
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((r) => {
            if (r.status === "fulfilled" && r.value !== null) {
                successfulGenders.push(r.value.gender);
            } else if (r.status === "rejected") {
                currentFailedCount++;
            }
        });

        if (i + batchSize < urls.length) {
            await sleepTime(delayBetweenBatches);
        }
    }

    return { successfulGenders, failedCount: currentFailedCount };
};

const fetchMaxPages = async (): Promise<number | null> => {
    const endpoint = "https://www.swapi.tech/api/people";

    try {
        const response = await fetch(endpoint);

        if (!response.ok) {
            if (response.status === 429) {
                console.warn("Rate limit reached while fetching total_pages.");
            } else {
                console.error(`Failed to fetch total_pages: ${response.status} ${response.statusText}`);
            }
            return null;
        }

        const json = await response.json();
        return json.total_pages ?? null;

    } catch (error) {
        console.error("Unexpected error while fetching total_pages:", error);
        return null;
    }
};


const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#A020F0", "#FF4500", "#7FFF00", "#DDA0DD"];

const useGenderData = (page: number, limit: number, t: (key: string, options?: Record<string, string | number>) => string) => {
    return useQuery({
        queryKey: ['genderData', page, limit],
        queryFn: async () => {
            const totalPagesFromApi = await fetchMaxPages() ?? 9;

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
            const characterUrls = listJson.results.map((r: { url: string }) => r.url);

            const { successfulGenders: gendersFromPage, failedCount } = await fetchGenderDetailsBatch(characterUrls, 1000);

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
        placeholderData: (prevData) => prevData,
    });
};

const BarChartComponent = () => {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const [isSmallMobile, setIsSmallMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [currentPage, setCurrentPage] = useState(() => {
        const savedPage = localStorage.getItem('barChartCurrentPage');
        return savedPage ? parseInt(savedPage, 10) : 1;
    });
    const [totalRecords, setTotalRecords] = useState<number | null>(null);
    const CHART_FETCH_LIMIT = 10 as const;
    const queryClient = useQueryClient();

    const [accumulatedGenders, setAccumulatedGenders] = useState<string[]>(() => {
        const saved = localStorage.getItem('accumulatedGenders');
        return saved ? JSON.parse(saved) : [];
    });
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
        localStorage.setItem('barChartCurrentPage', currentPage.toString());
    }, [currentPage]);

    useEffect(() => {
        fetchTotalRecords().then(setTotalRecords);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (accumulatedGenders.length > 0) {
                localStorage.setItem('accumulatedGenders', JSON.stringify(accumulatedGenders));
                localStorage.setItem('processedPages', JSON.stringify([...processedPages.current]));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [accumulatedGenders]);

    const {
        data: genderData,
        isLoading,
        error: queryError,
        isFetching
    } = useGenderData(currentPage, CHART_FETCH_LIMIT, t);

    useEffect(() => {
        if (genderData && !processedPages.current.has(currentPage)) {
            setAccumulatedGenders(prev => {
                const newGenders = genderData.genders;
                if (newGenders.length > 0) {
                    processedPages.current.add(currentPage);
                    return [...prev, ...newGenders];
                }
                return prev;
            });
            hasFetchedAllPages.current = genderData.hasFetchedAll;
        }
    }, [genderData, currentPage]);

    const handleFetchNextPage = useCallback(() => {
        if (!isFetching && genderData && currentPage < genderData.totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (!isFetching && genderData && currentPage >= genderData.totalPages && genderData.totalPages > 0) {
            toast.info(t("noMorePagesToLoad"));
        }
    }, [isFetching, currentPage, genderData, t]);

    const handleResetData = useCallback(() => {
        queryClient.removeQueries({ queryKey: ['genderData'] });
        setCurrentPage(1);
        setAccumulatedGenders([]);
        processedPages.current = new Set();
        localStorage.removeItem('accumulatedGenders');
        localStorage.removeItem('processedPages');
        fetchTotalRecords().then(setTotalRecords);
        toast.info(t("resettingAndRefetchingData"));
    }, [queryClient, t]);

    const genderCount = useCallback(() => {
        if (accumulatedGenders.length === 0) {
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

        accumulatedGenders.forEach(gender => {
            const normalizedGender = gender.toLowerCase();
            if (Object.prototype.hasOwnProperty.call(counts, normalizedGender)) {
                counts[normalizedGender]++;
            } else {
                counts.unknown++;
            }
        });

        const translatedCounts: Record<string, number> = {};
        Object.entries(counts).forEach(([key, value]) => {
            if (value > 0) {
                translatedCounts[t(`genderTwo.${key}`)] = value;
            }
        });

        return translatedCounts;
    }, [accumulatedGenders, t]);

    const barData = useMemo(() => {
        const counts = genderCount();
        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            fill: COLORS[Object.keys(counts).indexOf(name) % COLORS.length]
        }));
    }, [genderCount]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
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

    if (queryError) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px] text-red-600">
                <p>{t("errorFetchingGenderData")}</p>
                <button
                    onClick={handleResetData}
                    className="group mt-4 px-4 py-2 rounded-2xl cursor-pointer bg-dark-600 text-white hover:shadow-lg hover:bg-dark-500 transition-shadow duration-200"
                >
                    {t("retryLoadingData")}
                </button>
            </div>
        );
    }

    if ((isLoading || isFetching) && accumulatedGenders.length === 0) {
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

    if (barData.length === 0 && !isLoading && !isFetching && accumulatedGenders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[350px] md:h-[400px]">
                <span className="text-xs sm:text-sm md:text-md lg:text-lg text-shadow">{t("noGenderDataAvailable")}</span>
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
                <p>{t("totalRecordsForCharts")}: {totalRecords || t("loading")}</p>
                <p>{t("loadedRecords")}: {accumulatedGenders.length}</p>
                <p>{t("currentPage")}: {currentPage}/{genderData?.totalPages || '?'}</p>
            </div>

            <ResponsiveContainer width="100%" height={chartHeight}>
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
                    <Tooltip
                        formatter={(value) => [`${value}`, t("characters")]}
                        contentStyle={{
                            fontSize: isMobile ? '11px' : isTablet ? '12px' : '13px',
                            padding: isMobile ? '4px 6px' : isTablet ? '5px 7px' : '6px 8px'
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        height={isMobile ? 30 : isTablet ? 33 : 36}
                        wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
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
                            total: genderData?.totalPages || 0,
                            type: t("gender"),
                            limit: CHART_FETCH_LIMIT
                        })}
                    </span>
                ) : (
                    <>
                        {!hasFetchedAllPages.current && genderData && currentPage < genderData.totalPages && (
                            <button
                                onClick={handleFetchNextPage}
                                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-muted text-foreground text-sm font-medium px-4 py-2 shadow-sm hover:bg-muted/70 hover:text-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || isFetching || (genderData ? currentPage >= genderData.totalPages : true) || (totalRecords !== null && accumulatedGenders.length >= totalRecords)}
                            >
                                {t("fetchNextPage", {
                                    page: currentPage + 1,
                                    total: genderData?.totalPages || 0
                                })}
                            </button>
                        )}
                        {hasFetchedAllPages.current && genderData?.totalPages && genderData.totalPages > 0 && (
                            <span className="text-center text-sm text-gray-500">
                                {t("allGenderDataLoaded", {
                                    totalRecords: accumulatedGenders.length
                                })}
                            </span>
                        )}
                    </>
                )}

                <button
                    onClick={handleResetData}
                    className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-muted/70 text-foreground text-sm font-medium px-4 py-2 shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(isLoading || isFetching) && accumulatedGenders.length === 0}
                >
                    {t("resetAndRefetchGenderData")}
                </button>
            </div>
        </div>
    );
};

export default BarChartComponent;