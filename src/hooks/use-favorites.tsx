import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FAVORITES_QUERY_KEY = ['favorites'];

export function useFavorites() {
    const queryClient = useQueryClient();

    const { data: favorites = {} } = useQuery<Record<string, boolean>>({
        queryKey: FAVORITES_QUERY_KEY,
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
            queryClient.setQueryData(FAVORITES_QUERY_KEY, data);
        }
    });

    const toggleFavorite = (id: string) => {
        const updated = { ...favorites };
        if (updated[id]) {
            delete updated[id];
        } else {
            updated[id] = true;
        }
        mutation.mutate(updated);
    };
    const clearAll = () => {
        mutation.mutate({});
    };
    const favoritesArray = Object.keys(favorites);

    return {
        favorites,
        favoritesArray,
        toggleFavorite,
        clearAll
    };
}
