import {useFavoritesPeople, useFavoritesStarships} from '@/hooks/use-favorites';
import { useTranslation } from 'react-i18next';
import React, { useState} from "react";

interface FavoriteTableCellProps {
    id: string;
    name: string;
    favoritesKey: "PEOPLE" | "STARSHIPS";
}

export function FavoriteTableCell({id, name, favoritesKey}: FavoriteTableCellProps) {
    const { t } = useTranslation();
    const { favorites: peopleFavorites, toggleFavoritePeople } = useFavoritesPeople();
    const { favorites: starshipsFavorites, toggleFavoriteStarships } = useFavoritesStarships();
    const favorites = favoritesKey === "PEOPLE" ? peopleFavorites : starshipsFavorites;
    const toggleFavorite = favoritesKey === "PEOPLE" ? toggleFavoritePeople : toggleFavoriteStarships;
    
    const [isClicked, setIsClicked] = useState(false);
    const isFavorite = favorites[id];

    const handleFavoriteClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 200);
        toggleFavorite(id);
    };
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleFavoriteClick}
                className={`
                    relative
                    cursor-pointer 
                    focus:outline-none
                    p-1
                    rounded-full
                    transition-all
                    duration-200
                    ease-out
                    transform
                    hover:scale-155
                    hover:bg-ghost-150
                    hover:shadow-sm
                    active:scale-110
                    ${isClicked ? 'animate-pulse scale-155' : ''}
                `}
                title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                {isFavorite ? '❤️' : '🤍'}
            </button>
            <span>{name}</span>
        </div>
    );
}