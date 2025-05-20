import { useFavorites } from '@/hooks/use-favorites';
import { useTranslation } from 'react-i18next';

interface FavoriteTableCellProps {
    id: string;
    name: string;
}

export function FavoriteTableCell({id, name}: FavoriteTableCellProps) {
    const { t } = useTranslation();
    const { favorites, toggleFavorite } = useFavorites();
    const isFavorite = favorites[id];

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => toggleFavorite(id)}
                className="cursor-pointer focus:outline-none"
                title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                {isFavorite ? '❤️' : '🤍'}
            </button>
            <span>{name}</span>
        </div>
    );
}