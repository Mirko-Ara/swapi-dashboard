import { useQuery } from "@tanstack/react-query"
import type { Person } from "@/types";

interface SwapiListResponse {
    next: string | null
    results: { url: string }[]
}

interface SwapiDetailResponse {
    result: {
        properties: Person
    }
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

const fetchWithRetry = async (url: string, retries = 3, delay = 500): Promise<Response | null> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url)
            if (response.ok) return response

            if (response.status === 429) {
                console.warn(`429 Too Many Requests for ${url}, retrying in ${delay}ms...`)
                await sleep(delay)
                delay *= 2
            } else {
                console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`)
                return null
            }
        } catch (error) {
            console.error(`Fetch failed for ${url}: ${error}`)
            await sleep(delay)
        }
    }
    console.error(`Max retries exceeded for ${url}`)
    return null
}

const fetchAllPeople = async (): Promise<Person[]> => {
    const cachedData = localStorage.getItem("swapi-people-data");
    if(cachedData) {
        try {
            const parsedData = JSON.parse(cachedData);
            const cacheTime = localStorage.getItem("swapi-people-timestamp");

            if(cacheTime && (Date.now() - parseInt(cacheTime)) < 1000 * 60 * 10) {
                console.log('Utilizing cached data from localStorage');
                return parsedData;
            }
        } catch(err) {
            console.error('Error parsing cached data from localStorage: ', err);;
        }
    }
    const allPeople: Person[] = []
    let url: string | null = "https://www.swapi.tech/api/people"
    let page: number = 1;
    const totalPages: number = 9;
    const delayBetweenRequests = 1000;

    while (url) {
        console.log(`Fetching page ${page} of ${totalPages}: ${url}`)
        const listResp = await fetchWithRetry(url)
        if (!listResp) break

        const json: SwapiListResponse = await listResp.json()
        const results = json.results || []

        for (const { url: detailUrl } of results) {
            try {
                const personRes = await fetchWithRetry(detailUrl);
                if(personRes) {
                    const personJson: SwapiDetailResponse = await personRes.json();
                    allPeople.push(personJson.result.properties);
                }
                await sleep(delayBetweenRequests);
            } catch (err) {
                console.error(`Error parsing JSON for ${detailUrl}: `, err)
            }
        }

        url = json.next;
        page++;
        await sleep(delayBetweenRequests);
    }
    try {
        localStorage.setItem("swapi-people-data", JSON.stringify(allPeople));
        localStorage.setItem("swapi-people-timestamp", Date.now().toString());
    } catch(e) {
        console.error('Error saving data to localStorage: ', e);
    }

    return allPeople
}

export function useSwapiPeople() {
    return useQuery<Person[]>({
        queryKey: ["swapi-people"],
        queryFn: fetchAllPeople,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        retry: 2,
        retryDelay: 1000,
    })
}
