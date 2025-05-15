import { useQuery } from "@tanstack/react-query";
import type { Person } from "@/types";
import { toast } from "sonner";

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

const fetchWithRetry = async (
    url: string,
    retries = 3,
    delay = 1000
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
): Promise<Person[]> => {
    const results: Person[] = [];
    const failedCount = { count: 0 };

    // Fetch in batches of 5 in parallel
    const batchSize = 5;

    for (let i = 0; i < urls.length; i += batchSize) {
        const batchUrls = urls.slice(i, i + batchSize);
        // Promise.allSettled per batch per page
        const batchPromises = batchUrls.map(async (url) => {
            const res = await fetchWithRetry(url);
            if (!res) {
                failedCount.count++;
                return null;
            }
            try {
                const data: SwapiDetailResponse = await res.json();
                return data.result.properties;
            } catch (err) {
                console.error(`Error parsing JSON for ${url}:`, err);
                failedCount.count++;
                return null;
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((r) => {
            if (r.status === "fulfilled" && r.value !== null) {
                results.push(r.value);
            }
        });

        if (i + batchSize < urls.length) {
            await sleep(delayBetweenBatches);
        }
    }

    if (failedCount.count > 0) {
        toast.warning(
            `${failedCount.count} character${failedCount.count > 1 ? "s" : ""} failed to load.`
        );
    }

    return results;
};


const fetchAllPeople = async (): Promise<Person[]> => {
    // Caching layer
    const cachedData = localStorage.getItem("swapi-people-data");
    const cacheTimestamp = localStorage.getItem("swapi-people-timestamp");

    if (
        cachedData &&
        cacheTimestamp &&
        Date.now() - parseInt(cacheTimestamp, 10) < 1000 * 60 * 10
    ) {
        try {
            console.log("Utilizing cached data from localStorage");
            return JSON.parse(cachedData);
        } catch (e) {
            console.error("Error parsing cached data:", e);
        }
    }

    const allPeople: Person[] = [];
    let page = 1;
    let url: string | null = "https://www.swapi.tech/api/people";
    const delayBetweenPages = 1500;
    const totalPagesFetch = async (): Promise<number | null> => {
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
    const totalPages = await totalPagesFetch();
    while (url !== null) {
        console.log(`Fetching page ${page} of ${totalPages !== null ? totalPages : "9"} : ${url}`);
        toast(`Fetching page ${page} of ${totalPages !== null ? totalPages : "9"} ...`);

        const listResp = await fetchWithRetry(url);
        if (!listResp) {
            toast.error(`Error loading data for page ${page}!`);
            break;
        }

        const listJson: SwapiListResponse = await listResp.json();

        const characterUrls = listJson.results.map((r) => r.url);

        const peopleFromPage = await fetchPeopleDetailsBatch(characterUrls, 500);

        allPeople.push(...peopleFromPage);

        url = listJson.next;
        page++;

        if (url !== null) await sleep(delayBetweenPages);
    }

    toast.success("Data loaded successfully!");

    try {
        localStorage.setItem("swapi-people-data", JSON.stringify(allPeople));
        localStorage.setItem("swapi-people-timestamp", Date.now().toString());
    } catch (e) {
        console.error("Error saving data to localStorage:", e);
    }

    return allPeople;
};

export function useSwapiPeople() {
    return useQuery<Person[]>({
        queryKey: ["swapi-people"],
        queryFn: fetchAllPeople,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        retry: 2,
        retryDelay: 1000,
    });
}
