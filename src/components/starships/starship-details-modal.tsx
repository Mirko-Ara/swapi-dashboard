import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Starship } from '@/types';
import { useTranslation } from 'react-i18next';
import{useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {LoaderSpinner} from "@/components/layout/loader-spinner.tsx";
import {useFavoritesStarships} from "@/hooks/use-favorites.tsx";
import {Heart} from "lucide-react";
import i18n from "i18next";

interface StarshipDetailsModalProps {
    starship: Starship | null;
    isOpen: boolean;
    onClose: () => void;
}

interface StarshipsInfoExtra {
    films?: { title: string }[];
    pilots?: { name: string }[];
}

const useStarshipsDetails = (starship: Starship | null) => {
    const id = useMemo(() => starship?.url.split("/").filter(Boolean).pop(), [starship?.url]);

    return useQuery<StarshipsInfoExtra>({
        queryKey: ['swapi-info-starship-extra', id],
        queryFn: async () => {
            if(!id || !starship) {
                throw new Error("Starship ID or starship data is not available");
            }
            const fetchUrls = async (urls: string[]) => {
                return Promise.allSettled(urls.map(async (url) => {
                    try {
                        console.log(`Fetching data from ${url}`);
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`Error fetching ${url}: ${response.status}`);
                        }
                        return await response.json();
                    } catch (error) {
                        console.error(`Failed to fetch ${url}:`, error);
                        throw error;
                    }
                }));
            };
            const pilotsData = await fetchUrls(starship.pilots || []);
            const filmsData = await fetchUrls(starship.films || []);
            console.clear();
            return {
                pilots: pilotsData.map((pilot) => ({ name: pilot.status === 'fulfilled' && pilot.value?.result?.properties?.name ? pilot.value.result.properties.name : '' })),
                films: filmsData.map((film) => ({ title: film.status === 'fulfilled' && film.value?.result?.properties?.title? film.value.result.properties.title : '' }))
            }
        },
        enabled: !!id && !!starship && starship.pilots?.length !== undefined && starship.films?.length !== undefined && (starship.pilots?.length > 0 || starship.films?.length > 0),
        staleTime: Infinity,
        gcTime: Infinity,
    })
};

const formatNumberForDisplay = (value: string | number | undefined | null, unit?: string): string => {
    const locale = i18n.language ?? 'en-US';

    const invalidValues = [null, undefined, "n/a", "unknown", "none"];
    if (typeof value !== 'number' && invalidValues.includes(value)) {
        return i18n.t("unknown");
    }

    const cleaned = String(value).replace(/,/g, '');
    const num = parseFloat(cleaned);

    if(isNaN(num)){
        return String(value);
    }
    const formatted = new Intl.NumberFormat(locale).format(num);
    return unit ? `${formatted} ${unit}` : formatted;
};



export const StarshipDetailsModal = ({ starship, isOpen, onClose }: StarshipDetailsModalProps) => {
    const { t } = useTranslation();
    const { data: extraDetails, isLoading: loadingExtra} = useStarshipsDetails(starship);
    const {favorites} = useFavoritesStarships();

    const isFavorite = useMemo(() => {
        if(!starship?.url) return false;
        const starshipId = starship.url.split("/").slice(-1)[0];
        return favorites[starshipId]
    }, [starship?.url, favorites]);

    if (!starship) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="font-semibold italic flex items-center gap-2">{t('starshipDetailsTitle')}
                        <Heart className={`h-6 w-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}/>
                    </DialogTitle>
                    <DialogDescription className="font-semibold">
                        {t('starshipDetailsDescription', { name: starship.name })}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] max-h-[60vh] p-4">
                    <div className="grid gap-y-4 py-4">
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('starshipName')}:</p>
                            <p className="text-sm text-muted-foreground">{starship.name}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('starshipModel')}:</p>
                            <p className="text-sm text-muted-foreground">{starship.model}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('starshipManufacturer')}:</p>
                            <p className="text-sm text-muted-foreground">{starship.manufacturer}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('starshipPassengers')}:</p>
                            <p className="text-sm text-muted-foreground">{formatNumberForDisplay(starship.passengers)}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('starshipCargoCapacity')}:</p>
                            <p className="text-sm text-muted-foreground">{formatNumberForDisplay(starship.cargo_capacity, "kg")}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('starshipMaxAtmospheringSpeed')}:</p>
                            <p className="text-sm text-muted-foreground">{formatNumberForDisplay(starship.max_atmosphering_speed, "km/h")}</p>
                        </div>
                        <Separator />
                        { loadingExtra ? (
                            <div className="flex justify-center items-center py-8">
                                <LoaderSpinner size="lg" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 items-start gap-4">
                                    <p className="text-sm leading-none font-semibold italic">{t('starshipPilots')}:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {extraDetails?.pilots && extraDetails.pilots.length > 0
                                            ? extraDetails.pilots.map(p => p.name).join(', ')
                                            : t('notAvailable')}
                                    </p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 items-start gap-4">
                                    <p className="text-sm leading-none font-semibold italic">{t('starshipFilms')}:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {extraDetails?.films && extraDetails.films.length > 0
                                            ? extraDetails.films.map(f => f.title).join(', ')
                                            : t('notAvailable')}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};