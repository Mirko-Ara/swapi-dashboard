import {useQuery} from "@tanstack/react-query";
import type {Person} from "@/types";
import {toast} from "sonner";
import i18n from "@/i18n";
import {useEffect} from "react";

interface SwapiListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: { url: string }[];
    total_records: number;
    total_pages: number;
}

interface SwapiDetailResponse {
    result: {
        properties: Person;
    };
}

interface PeoplePageResult {
    people: Person[];
    totalRecords: number;
    totalPages: number;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const isTesting = false;

const fetchTotalPagesFetch = async (): Promise<number | null> => {
    try {
        const response = await fetch("https://www.swapi.tech/api/people");
        if (!response.ok) {
            if (response.status === 429) {
                console.warn("Rate limit hit when fetching total_pages");
            } else {
                console.error(`Error fetching total_pages: ${response.status} ${response.statusText}`);
            }
            return null;
        }
        const json = await response.json();
        return json.total_pages;
    } catch (error) {
        console.error("Error during total_pages fetching:", error);
        return null;
    }
};

export const fetchWithRetry = async (
    url: string,
    retries = 3,
    delay = 2000
): Promise<Response | null> => {
    if(isTesting && Math.random() > 0.5) {
        console.warn(`Skipping fetch for ${url} due to random skip logic.`);
        return null;
    }
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;

            if (response.status === 429) {
                console.warn(`429 Too Many Requests for ${url}, retrying in ${delay}ms...`);
                await sleep(delay);
                delay *= 2;
            } else {
                console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
                return null;
            }
        } catch (error) {
            console.error(`Fetch failed for ${url}: ${error}`);
            await sleep(delay);
        }
    }
    console.error(`Max retries exceeded for ${url}`);
    return null;
};

const fetchPeopleDetailsBatch = async (
    urls: string[],
    delayBetweenBatches: number
): Promise<{successful: Person[], failedCount: number}> => {
    const successful: Person[] = [];
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
                const data: SwapiDetailResponse = await res.json();
                return data.result.properties;
            } catch (err) {
                console.error(`Error parsing JSON for ${url}:`, err);
                return null;
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((r) => {
            if (r.status === "fulfilled" && r.value !== null) {
                successful.push(r.value);
            } else {
                currentFailedCount++;
            }
        });

        if (i + batchSize < urls.length) {
            await sleep(delayBetweenBatches);
        }
    }

    return {successful, failedCount: currentFailedCount};
};


const fetchPeoplePage = async (page: number, limit: number): Promise<PeoplePageResult> => {
    const totalPages: number = await fetchTotalPagesFetch() ?? 9;
    try {
        const url = `https://www.swapi.tech/api/people?page=${page}&limit=10`;
        const pageInfo = `SWAPI_FETCH_PAGE:PEOPLE:${page}:${totalPages}:limit ${limit}`;
        console.log(pageInfo, url);
        toast(i18n.t("fetchingPage", {
            page: page,
            type: i18n.t("characters"),
            total: totalPages,
            limit: limit,
        }));
        const listResponse = await fetchWithRetry(url);
        if (!listResponse) {
            toast.warning(i18n.t("errorLoadingDataPeopleForPage", { page }));
            throw new Error(`Failed to fetch people list for page ${page} of ${totalPages}, after retries.`);
        }

        const listJson: SwapiListResponse = await listResponse.json();
        const characterUrls = listJson.results.map((r) => r.url);

        const {successful: peopleFromPage, failedCount} = await fetchPeopleDetailsBatch(characterUrls, 1000);
        if (failedCount > 0) {
            toast.warning(
                i18n.t("failedCharactersCount", {
                    count: failedCount,
                    page: page,
                })
            );
        }
        toast.success(i18n.t("dataPeopleLoadedSuccessfully", {
            page: page,
        }));
        return {
            people: peopleFromPage,
            totalRecords: listJson.total_records,
            totalPages: listJson.total_pages || totalPages,
        };
    } catch (error) {
        console.error(`Error fetching people for page ${page}:`, error);
        toast.warning(i18n.t("errorLoadingDataPeopleForPage", { page }));
        throw error;
    }
};

export function useSwapiPeople(page: number, limit: number = 10) {
    const { data, isLoading, error, refetch, isRefetching, isError } = useQuery<PeoplePageResult, Error, PeoplePageResult, ["swapi-people", typeof page, typeof limit]>({
        queryKey: ["swapi-people", page, limit],
        queryFn: () => fetchPeoplePage(page, limit),
        staleTime: 1000 * 60 * 60 * 24,
        placeholderData: (prevData) => prevData,
        gcTime: 1000 * 60 * 60 * 24,
        enabled: !!page && !!limit && page > 0 && limit > 0,
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if(isError && error) {
            console.error("Error fetching SWAPI people data:", error);
        }
    }, [isError, error]);

    return {
        people: data?.people || [],
        totalPeople: data?.totalRecords,
        totalPages: data?.totalPages === undefined ? 9 : data.totalPages,
        isLoading,
        error,
        refetch,
        isRefetching,
    };
}