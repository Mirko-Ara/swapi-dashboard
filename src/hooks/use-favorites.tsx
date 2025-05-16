import { useCallback, useMemo, useState } from "react";
// mi piacerebbe implementare le logiche dei favorites per andare a selezionare i preferiti nei characters in users
export function useFavorites() {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const toggleFavorite = useCallback((id: string) => {
        setFavorites(prev => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            return new Set(updated);
        });
    }, []);

    const favoritesArray = useMemo(() => Array.from(favorites), [favorites]);

    return { favorites, favoritesArray, toggleFavorite };
}
