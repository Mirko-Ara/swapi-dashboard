import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FAVORITES_PEOPLE_QUERY_KEY = ['favorites'] as const;
const FAVORITES_STARSHIPS_QUERY_KEY = ['favoritesStarships'] as const;

interface FavoritesPeople {
    favorites: Record<string, boolean>;
    favoritesArray: string[];
    toggleFavoritePeople: (id: string) => void;
    clearAll: () => void;
    clearCurrentPageFavorites: (idsToRemove: string[]) => void;
}

interface FavoritesStarships {
    favorites: Record<string, boolean>;
    favoritesArray: string[];
    toggleFavoriteStarships: (id: string) => void;
    clearAll: () => void;
    clearCurrentPageFavorites: (idsToRemove: string[]) => void;
}

const removeCurrentPageFavoritesByIds = (currentFavorites: Record<string, boolean>, idsToRemove: string[]): Record<string, boolean> => {
    const updatedFavorites = { ...currentFavorites };
    idsToRemove.forEach(id => {
        if(updatedFavorites[id]){
            delete updatedFavorites[id];
        }
    });
    return updatedFavorites;
};

const toggleFavorite = (favorites: Record<string, boolean>, id: string): Record<string , boolean> => {
    const updated = { ...favorites };
    if (updated[id]){
        delete updated[id]
    } else {
        updated[id] = true;
    }
    return updated;
};

export function useFavoritesPeople(): FavoritesPeople {
    const queryClient = useQueryClient();

    const { data: favorites = {} } = useQuery<Record<string, boolean>>({
        queryKey: FAVORITES_PEOPLE_QUERY_KEY,
        queryFn: async () => {
            return {};
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const mutation = useMutation({
        mutationFn: async (newFavorites: Record<string, boolean>) => {
            return newFavorites;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(FAVORITES_PEOPLE_QUERY_KEY, data);
        }
    });

    const toggleFavoritePeople = (id: string) => {
        mutation.mutate(toggleFavorite(favorites, id));
    };

    const clearAll = () => {
        mutation.mutate({});
    };

    const clearCurrentPageFavorites = (idsToRemove: string[]) => {
        mutation.mutate(removeCurrentPageFavoritesByIds(favorites, idsToRemove));
    }
    const favoritesArray = Object.keys(favorites);

    return {
        favorites,
        favoritesArray,
        toggleFavoritePeople,
        clearAll,
        clearCurrentPageFavorites,
    };
}

export function useFavoritesStarships(): FavoritesStarships {
    const queryClient = useQueryClient();
    const {data: favorites = {}} = useQuery<Record<string, boolean>>({
        queryKey: FAVORITES_STARSHIPS_QUERY_KEY,
        queryFn: async () => {
            return {};
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });
    const mutation = useMutation({
        mutationFn: async (newFavorites: Record<string, boolean>) => {
            return newFavorites;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(FAVORITES_STARSHIPS_QUERY_KEY, data);
        }
    });
    const toggleFavoriteStarships = (id: string) => {
        mutation.mutate(toggleFavorite(favorites, id));
    };

    const clearAll = () => {
        mutation.mutate({});
    };

    const clearCurrentPageFavorites = (idsToRemove: string[]) => {
        mutation.mutate(removeCurrentPageFavoritesByIds(favorites, idsToRemove));
    }

    const favoritesArray = Object.keys(favorites);
    return {
        favorites,
        favoritesArray,
        toggleFavoriteStarships,
        clearAll,
        clearCurrentPageFavorites
    };
}
