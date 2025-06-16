import {useQuery} from '@tanstack/react-query';
import type {Starship} from '@/types';
import {toast} from "sonner";
import i18n from 'i18next';
import { fetchWithRetry} from "@/hooks/use-swapi";
import { useEffect } from "react";

interface SwapiStarshipListResponse {
    total_records: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
    results: { url: string}[];
}
interface SwapiStarshipDetailResponse {
    result: {
        properties: Starship;
    };
}

interface StarshipPageResult {
    starships: Starship[];
    totalRecords: number;
    totalPages: number;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));


const totalPagesFetch = async (): Promise<number | null> => {
    try {
        const response = await fetch('https://swapi.tech/api/starships/');
        if(!response.ok) {
            if(response.status === 429) {
                console.warn("Rate limit hit when fetching total_pages");
            } else {
                console.error(`Error fetching total_records: ${response.status}`);
            }
            return 36;
        }
        const json = await response.json() as SwapiStarshipListResponse;
        return json.total_pages;
    } catch (error) {
        console.error("Error fetching total expected starships:", error);
        return 4; // Default value if fetching fails
    }
};

const fetchStarshipDetailsBatch = async (
    urls: string[],
    delayBetweenBatches: number
): Promise<{successful: Starship[], failedCount: number}> => {
  const successful: Starship[] = [];
  let currentFailedCount = 0;
  const batchSize = 5;
  for ( let i = 0; i < urls.length; i += batchSize) {
      const batchUrls = urls.slice(i, i + batchSize);
      const batchPromises = batchUrls.map(async (url) => {
          const res = await fetchWithRetry(url);
          if(!res) return null;
          try {
              const data: SwapiStarshipDetailResponse = await res.json();
              return data.result.properties;
          } catch (error) {
              console.error(`Error parsing starship data for ${url}: `, error);
              return null;
          }
      });
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result) => {
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

const fetchStarshipsPage = async (page: number, limit: number): Promise<StarshipPageResult> => {
    const totalPages: number = await totalPagesFetch() ?? 4;
    try {
        const url = `https://www.swapi.tech/api/starships?page=${page}&limit=10`;
        const pageInfo = `SWAPI_FETCH_PAGE:STARSHIPS:${page}:${totalPages}:limit ${limit}`;
        console.log(pageInfo, url);
        toast(i18n.t("fetchingPage", {
            page: page,
            type: i18n.t("starships"),
            total: totalPages,
            limit: limit,
        }));
        const listResponse = await fetchWithRetry(url);
        if (!listResponse) {
            toast.warning(i18n.t("errorLoadingDataStarshipsForPage", { page }));
            throw new Error(`Failed to fetch people list for page ${page} of ${totalPages}, after retries.`);
        }

        const listJson: SwapiStarshipListResponse = await listResponse.json();
        const starshipsUrls = listJson.results.map((r) => r.url);

        const {successful: starshipsFromPage, failedCount} = await fetchStarshipDetailsBatch(starshipsUrls, 1000);
        if (failedCount > 0) {
            toast.warning(
                i18n.t("failedStarshipsCount", {
                    count: failedCount,
                    page: page,
                })
            );
        }
        toast.success(i18n.t("dataStarshipsLoadedSuccessfully", {
            page: page,
        }));
        return {
            starships: starshipsFromPage,
            totalRecords: listJson.total_records,
            totalPages: listJson.total_pages || totalPages,
        };
    } catch (error) {
        console.error(`Error fetching starships for page ${page}:`, error);
        toast.warning(i18n.t("errorLoadingDataStarshipsForPage", { page }));
        throw error;
    }
};

export function useSwapiStarships(page: number, limit: number = 10) {
    const { data, isLoading, error, refetch, isRefetching, isError} = useQuery<StarshipPageResult, Error, StarshipPageResult, ["swapi-starships", typeof page, typeof limit]>({
        queryKey: ["swapi-starships", page, limit],
        queryFn: () => fetchStarshipsPage(page, limit),
        staleTime: 1000 * 60 * 60 * 24,
        placeholderData: (prevData) => prevData,
        gcTime: 1000 * 60 * 60 * 24,
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if(isError && error) {
            console.error("Error fetching starships data: ", error?.message);
        }
    }, [isError, error]);

    return {
        starships: data?.starships || [],
        totalStarships: data?.totalRecords,
        totalPages: data?.totalPages === undefined ? 4 : data?.totalPages,
        isLoading,
        error,
        refetch,
        isRefetching,
    }
}