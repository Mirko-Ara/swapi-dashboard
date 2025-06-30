import {useQuery} from '@tanstack/react-query';
import type {Species} from '@/types';
import {toast} from "sonner";
import i18n from 'i18next';
import { fetchWithRetry} from "@/hooks/use-swapi";
import { useEffect } from "react";

interface SwapiSpeciesListResponse {
    total_records: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
    results: { url: string}[];
}
interface SwapiSpeciesDetailResponse {
    result: {
        properties: Species;
    };
}

interface SpeciesPageResult {
    species: Species[];
    totalRecords: number;
    totalPages: number;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));


const totalPagesFetch = async (): Promise<number | null> => {
    try {
        const response = await fetch('https://swapi.tech/api/species/');
        if(!response.ok) {
            if(response.status === 429) {
                console.warn("Rate limit hit when fetching total_pages");
            } else {
                console.error(`Error fetching total_records: ${response.status}`);
            }
            return 37;
        }
        const json = await response.json() as SwapiSpeciesListResponse;
        return json.total_pages;
    } catch (error) {
        console.error("Error fetching total expected species:", error);
        return 4; // Default value if fetching fails
    }
};

const fetchSpeciesDetailsBatch = async (
    urls: string[],
    delayBetweenBatches: number
): Promise<{successful: Species[], failedCount: number}> => {
    const successful: Species[] = [];
    let currentFailedCount = 0;
    const batchSize = 5;
    for ( let i = 0; i < urls.length; i += batchSize) {
        const batchUrls = urls.slice(i, i + batchSize);
        const batchPromisesSpecies = batchUrls.map(async (url) => {
            const res = await fetchWithRetry(url);
            if(!res) return null;
            try {
                const data: SwapiSpeciesDetailResponse = await res.json();
                return data.result.properties;
            } catch (error) {
                console.error(`Error parsing species data for ${url}: `, error);
                return null;
            }
        });
        const batchResultsSpecies = await Promise.allSettled(batchPromisesSpecies);
        batchResultsSpecies.forEach((result) => {
            if(result.status === "fulfilled" && result.value !== null) {
                successful.push(result.value);
            } else {
                currentFailedCount += 1;
            }
        });
        if(i + batchSize < urls.length) {
            await sleep(delayBetweenBatches);
        }
    }
    return {successful, failedCount: currentFailedCount};
};

const fetchSpeciesPage = async (page: number, limit: number): Promise<SpeciesPageResult> => {
    const totalPages: number = await totalPagesFetch() ?? 4;
    try {
        const url = `https://www.swapi.tech/api/species?page=${page}&limit=10`;
        const pageInfo = `SWAPI_FETCH_PAGE:SPECIES:${page}:${totalPages}:limit ${limit}`;
        console.log(pageInfo, url);
        toast(i18n.t("fetchingPage", {
            page: page,
            type: i18n.t("species"),
            total: totalPages,
            limit: limit,
        }));
        const listResponse = await fetchWithRetry(url);
        if (!listResponse) {
            toast.warning(i18n.t("errorLoadingDataSpeciesForPage", { page }));
            throw new Error(`Failed to fetch species list for page ${page} of ${totalPages}, after retries.`);
        }

        const listJson: SwapiSpeciesListResponse = await listResponse.json();
        const speciesUrls = listJson.results.map((r) => r.url);

        const {successful: speciesFromPage, failedCount} = await fetchSpeciesDetailsBatch(speciesUrls, 1000);
        if (failedCount > 0) {
            toast.warning(
                i18n.t("failedSpeciesCount", {
                    count: failedCount,
                    page: page,
                })
            );
        }
        toast.success(i18n.t("dataSpeciesLoadedSuccessfully", {
            page: page,
        }));
        return {
            species: speciesFromPage,
            totalRecords: listJson.total_records,
            totalPages: listJson.total_pages || totalPages,
        };
    } catch (error) {
        console.error(`Error fetching species for page ${page}:`, error);
        toast.warning(i18n.t("errorLoadingDataSpeciesForPage", { page }));
        throw error;
    }
};

export function useSwapiSpecies(page: number, limit: number = 10) {
    const { data, isLoading, error, refetch, isRefetching, isError} = useQuery<SpeciesPageResult, Error, SpeciesPageResult, ["swapi-species", typeof page, typeof limit]>({
        queryKey: ["swapi-species", page, limit],
        queryFn: () => fetchSpeciesPage(page, limit),
        staleTime: 1000 * 60 * 60 * 24,
        placeholderData: (prevData) => prevData,
        gcTime: 1000 * 60 * 60 * 24,
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if(isError && error) {
            console.error("Error fetching species data: ", error?.message);
        }
    }, [isError, error]);

    return {
        species: data?.species || [],
        totalSpecies: data?.totalRecords,
        totalPages: data?.totalPages === undefined ? 4 : data?.totalPages,
        isLoading,
        error,
        refetch,
        isRefetching,
    }
}