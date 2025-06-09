import {useFavoritesPeople, useFavoritesStarships} from '@/hooks/use-favorites';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import type { Person } from '@/types';
import { X } from 'lucide-react';
import { ScrollArea } from "@radix-ui/react-scroll-area";

interface FavoritesDropdownProps {
    data: Person[];
    favoritesKey: "PEOPLE" | "STARSHIPS";
}

export function FavoritesDropdown({ data, favoritesKey }: FavoritesDropdownProps) {
    const { t } = useTranslation();
    const { favoritesArray: favoritePeopleArray, toggleFavoritePeople, clearAll: clearAllPeople } = useFavoritesPeople();
    const {favoritesArray: favoriteStarshipsArray, toggleFavoriteStarships, clearAll: clearAllStarships } = useFavoritesStarships();
    const favoritesArray = favoritesKey === "PEOPLE" ? favoritePeopleArray : favoriteStarshipsArray;
    const toggleFavorite = favoritesKey === "PEOPLE" ? toggleFavoritePeople : toggleFavoriteStarships;
    const clearAll = favoritesKey === "PEOPLE" ? clearAllPeople : clearAllStarships;

    if (!data || data.length === 0) {
        return <p className="p-4 text-sm text-muted-foreground">{t('loadingData')}</p>;
    }

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="flex items-center justify-between pb-2 px-4 pt-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    {t('favorites')} <span>❤️</span>
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer focus:outline-none"
                    onClick={clearAll}
                >
                    {t('clearAll')}
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                {favoritesArray.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                        {t('noFavorites')}
                    </div>
                ) : (
                    <ScrollArea className="max-h-64">
                        <ul className="divide-y divide-border">
                            {favoritesArray.map((id) => {
                                const person = data.find((p) => p.url?.split('/').pop() === id);
                                if (!person) {
                                    return (
                                        <li key={id} className="px-4 py-2 text-sm italic text-muted-foreground">
                                            {t('unknown')}
                                        </li>
                                    );
                                }
                                return (
                                    <li
                                        key={id}
                                        className="flex items-center justify-between px-4 py-2 hover:bg-accent transition-colors"
                                    >
                                        <span className="truncate text-sm font-medium">{person.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="cursor-pointer"
                                            onClick={() => toggleFavorite(id)}
                                        >
                                            <X className="h-4 w-4 text-destructive" />
                                            <span className="sr-only">{t('removeFromFavorites')}</span>
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
