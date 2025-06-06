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
}

interface SwapiDetailResponse {
    result: {
        properties: Person;
    };
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const fetchTotalExpectedCharacters = async (): Promise<number> => {
    try{
        const response = await fetch("https://www.swapi.tech/api/people");
        if(!response.ok) {
            throw new Error(`Error fetching total_pages: ${response.status} ${response.statusText}`);
        }
        const json = await response.json();
        return json.total_records;
    } catch (error) {
        console.error("Error during total_expected_characters fetching:", error);
        return 82; // Default value if fetching fails
    }
};

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


const fetchAllPeople = async (): Promise<Person[]> => {
    const allPeople: Person[] = [];
    let page = 1;
    const delayBetweenPages = 1500;

    let totalExpectedCharacters = 82;
    try {
        totalExpectedCharacters = await fetchTotalExpectedCharacters();
    } catch (error) {
        console.error("Could not fetch total expected characters, using default.", error);
    }

    let totalPages = 9; // fallback value
    const fetchedTotalPages = await fetchTotalPagesFetch();
    if (fetchedTotalPages !== null) {
        totalPages = fetchedTotalPages;
    }

    let totalFailedPageListFetches = 0;
    let totalFailedCharacterDetailFetches = 0;

    while (page <= totalPages) {
        const currentUrl= `https://www.swapi.tech/api/people?page=${page}&limit=10`;
        const pageInfo = `SWAPI_FETCH_PAGE:PEOPLE:${page}:${totalPages}`;
        console.log(pageInfo, currentUrl);
        toast(i18n.t("fetchingPage", {
            page: page,
            type: i18n.t("characters"),
            total: totalPages,
        }));

        const listResp = await fetchWithRetry(currentUrl);
        if (!listResp) {
            toast.warning(i18n.t("errorLoadingDataPeopleForPage", { page }));
            console.warn(`Characters Page ${page} failed. Attempting next page...`);
            totalFailedPageListFetches++;
            page++;
            await sleep(delayBetweenPages);
            continue;
        }

        const listJson: SwapiListResponse = await listResp.json();
        const characterUrls = listJson.results.map((r) => r.url);

        const {successful: peopleFromPage, failedCount} = await fetchPeopleDetailsBatch(characterUrls, 1000);

        if (failedCount > 0) {
            totalFailedCharacterDetailFetches += failedCount;
            toast.warning(
                i18n.t("failedCharactersCount", {
                    count: failedCount,
                    page: page,
                })
            );
        }

        allPeople.push(...peopleFromPage);
        page++;

        if (page <= totalPages) {
            await sleep(delayBetweenPages);
        }
    }
    const totalActualFailedCharacters = Math.max(0, totalExpectedCharacters - allPeople.length);
    if (totalActualFailedCharacters > 0) {
        const translationKey = totalActualFailedCharacters === 1 ? "dataPeopleNotLoadedSuccessfully_one" : "dataPeopleNotLoadedSuccessfully_other";
        toast.error(i18n.t(translationKey, {
                failed: totalActualFailedCharacters,
                total: totalExpectedCharacters,
                success: allPeople.length,
                failedPages: totalFailedPageListFetches,
                failedDetails: totalFailedCharacterDetailFetches,
            })
        );
    } else {
        toast.success(i18n.t("dataPeopleLoadedSuccessfully"));
    }
    return allPeople;
};

export function useSwapiPeople() {
    const { data, isLoading, error, refetch, isRefetching, isError } = useQuery<Person[], Error, Person[], ["swapi-people"]>({
        queryKey: ["swapi-people"],
        queryFn: fetchAllPeople,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if(isError && error) {
            console.error("Error fetching SWAPI people data:", error);
        }
    }, [isError, error]);

    const { data: totalRecordsData, isLoading: isLoadingTotalRecords } = useQuery<number, Error, number, ["swapi-people-total-records"]>({
        queryKey: ["swapi-people-total-records"],
        queryFn: fetchTotalExpectedCharacters,
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
        totalExpectedCharacters: totalRecordsData,
        isLoadingTotalRecords,
    };
}