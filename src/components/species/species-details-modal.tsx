import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import type {Species} from '@/types';
import {useTranslation} from 'react-i18next';
import {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {LoaderSpinner} from "@/components/layout/loader-spinner.tsx";
import {useFavoritesSpecies} from "@/hooks/use-favorites.tsx";
import {Heart} from "lucide-react";
import i18n from "i18next";

interface SpeciesDetailsModalProps {
    species: Species | null;
    isOpen: boolean;
    onClose: () => void;
}

interface SpeciesInfoExtra {
    people?: { name: string }[];
    homeworld?: string;
}

const useSpeciesDetails = (species: Species | null) => {
    const id = useMemo(() => species?.url.split("/").filter(Boolean).pop(), [species?.url]);

    return useQuery<SpeciesInfoExtra>({
        queryKey: ['swapi-info-species-extra', id],
        queryFn: async () => {
            if(!id || !species) {
                throw new Error("Species ID or species data is not available");
            }
            const fetchPeopleUrls = async (urls: string[]) => {
                return Promise.allSettled(
                    urls.map(async (url) => {
                        try {
                            console.log(`Fetching data from ${url}`);
                            const response = await fetch(url);

                            return response.ok
                                ? await response.json()
                                : (() => { throw new Error(`Error fetching ${url}: ${response.status}`); })();
                        } catch (error) {
                            console.error(`Failed to fetch ${url}:`, error);
                            throw error;
                        }
                    })
                );
            };

            const speciesData = await fetchPeopleUrls(species.people || []);
            const homeworldData = await fetch(species.homeworld || '');
            return {
                people: speciesData.map((species) => ({ name: species.status === 'fulfilled' && species.value?.result?.properties?.name ? species.value.result.properties.name : '' })),
                homeworld: homeworldData.ok ?
                    await homeworldData.json().then(data => data.result?.properties?.name || i18n.t("unknown")) :
                    i18n.t("unknown")
            }
        },
        enabled: !!id && !!species && species.people?.length !== undefined && species.people?.length > 0 && species.homeworld !== undefined,
        staleTime: Infinity,
        gcTime: Infinity,
    })
};

const formatDataForDisplay = (value: string | number | undefined | null): string | number => {
    if (value === null || typeof value === 'undefined' || value === "n/a" || value === "none" || value === "unknown") {
        return i18n.t("unknown");
    }
    return value;
};



export const SpeciesDetailsModal = ({ species, isOpen, onClose }: SpeciesDetailsModalProps) => {
    const { t } = useTranslation();
    const { data: extraDetails, isLoading: loadingExtra} = useSpeciesDetails(species);
    const {favorites} = useFavoritesSpecies();

    const isFavorite = useMemo(() => {
        if(!species?.url) return false;
        const speciesId = species.url.split("/").slice(-1)[0];
        return favorites[speciesId]
    }, [species?.url, favorites]);

    if (!species) {
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
                        {t('starshipDetailsDescription', { name: species.name })}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] max-h-[60vh] p-4">
                    <div className="grid gap-y-4 py-4">
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('speciesName')}:</p>
                            <p className="text-sm text-muted-foreground">{species.name}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('classification')}:</p>
                            <p className="text-sm text-muted-foreground">{formatDataForDisplay(species.classification)}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('designation')}:</p>
                            <p className="text-sm text-muted-foreground">{formatDataForDisplay(species.designation)}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('averageHeight')}:</p>
                            <p className="text-sm text-muted-foreground">{formatDataForDisplay(species.average_height)}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 items-start gap-4">
                            <p className="text-sm leading-none font-semibold italic">{t('averageLifespan')}:</p>
                            <p className="text-sm text-muted-foreground">{formatDataForDisplay(species.average_lifespan)}</p>
                        </div>
                        <Separator />
                        { loadingExtra ? (
                            <div className="flex justify-center items-center py-8">
                                <LoaderSpinner size="lg" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 items-start gap-4">
                                    <p className="text-sm leading-none font-semibold italic">{t('homeworld')}:</p>
                                    <p className="text-sm text-muted-foreground">{formatDataForDisplay(extraDetails?.homeworld)}</p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 items-start gap-4">
                                    <p className="text-sm leading-none font-semibold italic">{t('people')}:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {extraDetails?.people && extraDetails.people.length > 0
                                            ? extraDetails.people.map(p => p.name).join(', ')
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