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

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const fetchTotalExpectedStarships = async (): Promise<number> => {
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
        return json.total_records;
    } catch (error) {
        console.error("Error fetching total expected starships:", error);
        return 36; // Default value if fetching fails
    }
};

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

const fetchAllStarships = async (): Promise<Starship[]> => {
    const allStarships: Starship[] = [];
    let page = 1;
    const delayBetweenPages = 1000;
    let expectedTotalStarships = 36;
    try {
        expectedTotalStarships = await fetchTotalExpectedStarships() ?? 36;
    } catch (error) {
        console.error("Error fetching total expected starships:", error);
    }

    let totalPages = 4;
    try {
        totalPages = await totalPagesFetch() ?? 4;
    } catch (error) {
        console.error("Error fetching total pages:", error);
    }

    let totalFailedPageListFetches = 0;
    let totalFailedStarshipsDetailsFetches = 0;

    while (page <= totalPages) {
        const currentPageUrl = `https://swapi.tech/api/starships/?page=${page}&limit=10`;
        const pageInfo = `SWAPI_FETCH_PAGE:STARSHIPS:${page}:${totalPages}`;
        console.log(pageInfo, currentPageUrl);
        toast(i18n.t("fetchingPage", {
            page: page,
            type: i18n.t("starships"),
            total: totalPages,
        }));
        const listResponse = await fetchWithRetry(currentPageUrl);
        if (!listResponse) {
            toast.warning(i18n.t("errorLoadingDataStarshipsForPage", { page }));
            console.warn(`Starships Page ${page} failed. Attempting next page...`);
            totalFailedPageListFetches++;
            page++;
            await sleep(delayBetweenPages);
            continue;
        }

        const listJson: SwapiStarshipListResponse = await listResponse.json();
        const characterUrls = listJson.results.map((starship) => starship.url);
        const {successful: starshipsFromPage, failedCount} = await fetchStarshipDetailsBatch(characterUrls, delayBetweenPages);
        if (failedCount > 0) {
            totalFailedStarshipsDetailsFetches += failedCount;
            toast.warning(
                i18n.t("failedStarshipsCount", {
                    count: failedCount,
                    page: page,
                })
            );
        }

        allStarships.push(...starshipsFromPage);
        page++;

        if(page <= totalPages) {
            await sleep(delayBetweenPages)
        }
    }
    const totalActualFailedStarships = Math.max(0, expectedTotalStarships - allStarships.length);
    if (totalActualFailedStarships > 0) {
        const translationKey = totalActualFailedStarships === 1 ? "dataStarshipsNotLoadedSuccessfully_one" : "dataStarshipsNotLoadedSuccessfully_other";
        toast.error(i18n.t(translationKey, {
            failed: totalActualFailedStarships,
            total: expectedTotalStarships,
            success: allStarships.length,
            failedPages: totalFailedPageListFetches,
            failedDetails: totalFailedStarshipsDetailsFetches,
        }))
    } else {
        toast.success(i18n.t("dataStarshipsLoadedSuccessfully"));
    }
    return allStarships;
};

export function useSwapiStarships() {
    const { data, isLoading, error, refetch, isRefetching, isError} = useQuery<Starship[], Error, Starship[], ["swapi-starships"]>({
        queryKey: ["swapi-starships"],
        queryFn: fetchAllStarships,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if(isError && error) {
            console.error("Error fetching starships data: ", error?.message);
        }
    }, [isError, error]);

    const {data: totalDataRecords, isLoading: isLoadingTotalRecords} = useQuery<number, Error, number, ["swapi-starships-total-records"]>({
        queryKey: ["swapi-starships-total-records"],
        queryFn: fetchTotalExpectedStarships,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
    });
    return {
        data,
        isLoading,
        error,
        refetch,
        isRefetching,
        expectedTotalStarships: totalDataRecords ?? 36,
        isLoadingTotalRecords,
    }
}