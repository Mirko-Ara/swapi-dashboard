import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    User,
    Calendar,
    Ruler,
    Eye,
    Palette,
    Weight,
    Heart,
    X,
    Home,
    Clapperboard,
    Car,
    Dna,
    Rocket
} from 'lucide-react';
import type { Person } from '@/types';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import React, {useCallback, useMemo, useEffect, useRef, useState} from "react";
import {useFavorites} from "@/hooks/use-favorites.tsx";
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {useQuery} from "@tanstack/react-query";
import {LoaderSpinner} from "@/components/layout/loader-spinner.tsx";

interface CharacterDetailsModalProps {
    character: Person | null;
    isOpen: boolean;
    onClose: () => void;
}

type DetailItem = {
    icon: React.ElementType;
    label: string;
    value: string | number | null;
    color: string;
};

interface SwapiInfoExtra {
    films?: { title: string }[];
    species?: { name: string }[];
    vehicles?: { name: string }[];
    starships?: { name: string }[];
}

const useSwapiInfoDetails = (character: Person | null) => {
    const id = character?.url.split("/").slice(-1)[0];
    return useQuery<SwapiInfoExtra>({
        queryKey: [`swapi-info-person/${id}/`],
        queryFn: async () => {
            if (!id || !character) {
                throw new Error("character ID or data is not available");
            }
            const fetchDataFromUrls = async (urls: string[]) => {
                return Promise.all(
                    urls.map(async (url) => {
                        try {
                            const res = await fetch(url);
                            if (!res.ok) {
                                new Error(`Failed to fetch: ${res.statusText}`);
                            }
                            return await res.json();
                    } catch(error) {
                            console.error(`Error fetching data from URL: ${url}:  ${error}`);
                            return;
                        }
                    })
                );
            };
            const res = await fetch(`https://swapi.py4e.com/api/people/${id}/`);
            if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
            const person = await res.json();

            const films = await fetchDataFromUrls(person.films || []);
            const species = await fetchDataFromUrls(person.species || []);
            const vehicles = await fetchDataFromUrls(person.vehicles || []);
            const starships = await fetchDataFromUrls(person.starships || []);

            return {
                films: films.map(film => ({ title: film.title})),
                species: species.map(s => ({ name: s.name})),
                vehicles: vehicles.map(v => ({ name: v.name})),
                starships: starships.map(starship => ({name: starship.name})),
            }
        },
        enabled: !!id && !!character,
        staleTime: Infinity,
        gcTime: Infinity,
    });
};

const DetailCard: React.FC<{detail: DetailItem, t: (key: string) => string, index: number }> = React.memo(({ detail, t, index}) => {
    const Icon = detail.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
        >
            <Card className="group relative overflow-hidden transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 border-0 bg-gradient-to-br from-white/80 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-900/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300" />
                <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                        </div>
                        {detail.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 relative z-10">
                    <Badge
                        variant="secondary"
                        className="break-words whitespace-normal bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 capitalize text-sm px-4 py-2 font-medium border-0 shadow-sm group-hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20 transition-all duration-300"
                    >
                        {detail.value !== null && detail.value !== "" ? detail.value : t("unknown")}
                    </Badge>
                </CardContent>
            </Card>
        </motion.div>
    );
});

export const CharacterDetailsModal = ({character, isOpen, onClose}: CharacterDetailsModalProps) => {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);
    const [topShadowOpacity, setTopShadowOpacity] = useState(0);
    const [bottomShadowOpacity, setBottomShadowOpacity] = useState(0);
    const [homeworldName, setHomeworldName] = useState<string | null>(null);
    const { favorites } = useFavorites();
    const { data: extra, isLoading: loadingExtra} = useSwapiInfoDetails(character);
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const fadeZone = 50;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const scrollBottom = scrollHeight - clientHeight - scrollTop;
        const isScrollable = scrollHeight > clientHeight;

        let newTopOpacity = 0;
        if(isScrollable && scrollTop > 0) {
            newTopOpacity = Math.min(1, scrollTop / fadeZone);
        }
        setTopShadowOpacity(newTopOpacity);
        setShowTopShadow(isScrollable && scrollTop > 0);

        let newBottomOpacity = 0;
        if(isScrollable && scrollBottom > 0) {
            newBottomOpacity = Math.min(1, scrollBottom / fadeZone);
        }
        setBottomShadowOpacity(newBottomOpacity);
        setShowBottomShadow(isScrollable && scrollBottom > 0);
    }, []);

    useEffect(() => {
        const fetchHomeWorld = async () => {
            if (!character?.homeworld) {
                setHomeworldName(null);
                return;
            }

            try {
                const response = await fetch(String(character.homeworld));
                if (!response.ok) {
                    new Error(`Failed to fetch: ${response.statusText}`);
                }
                const data = await response.json();
                console.log("Homeworld response:", data);
                const name = data.result?.properties?.name;
                setHomeworldName(name === 'Unknown' ?  t("unknown") : name || t("unknown"));
            } catch (error) {
                console.error("Error fetching homeworld:", error, character.homeworld);
                setHomeworldName(t("unknown"));
            }
        };

        fetchHomeWorld().catch((error) => console.error("Error fetching homeworld: ", error));
    }, [character, t]);

    useEffect(() => {
        if(isOpen && character) {
            const timeoutId = setTimeout(() => {
                handleScroll();
            }, 550);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, character, handleScroll]);

    const isFavorite = useMemo(() => {
        if(character) {
            const characterId = character.url.split("/").pop() ?? "";
            return favorites[characterId];
        }
        return false;
    }, [character, favorites]);

    const details: (DetailItem[] | null) = useMemo(() => {
        if(character) {
            const baseDetails: DetailItem[] = [
                {
                    icon: User,
                    label: t('name'),
                    value: character.name,
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Palette,
                    label: t('gender'),
                    value: character.gender,
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Calendar,
                    label: t("birthYear"),
                    value: character.birth_year,
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Ruler,
                    label: t("height"),
                    value: character.height ? `${character.height} cm` : 'Unknown',
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Weight,
                    label: t("mass"),
                    value: character.mass ? `${character.mass} kg` : 'Unknown',
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Eye,
                    label: t("eyeColor"),
                    value: character.eye_color,
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Palette,
                    label: t("hairColor"),
                    value: character.hair_color,
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Palette,
                    label: t("skinColor"),
                    value: character.skin_color,
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                },
                {
                    icon: Home,
                    label: 'Homeworld',
                    value: homeworldName ??  t("loading"),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                }
            ];
            if(extra?.films && extra.films.length > 0) {
                baseDetails.push({
                    icon: Clapperboard,
                    label: t("films"),
                    value: extra.films.map(film => film.title).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }

            if(extra?.vehicles && extra.vehicles.length > 0) {
                baseDetails.push({
                    icon: Car,
                    label: t("vehicles"),
                    value: extra.vehicles.map(vehicle => vehicle.name).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }
            if(extra?.species && extra.species.length > 0) {
                baseDetails.push({
                    icon: Dna,
                    label: t("species"),
                    value: extra.species.map(s => s.name).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }
            if(extra?.starships && extra.starships.length > 0) {
                baseDetails.push({
                    icon: Rocket,
                    label: t("starships"),
                    value: extra.starships.map(starship => starship.name).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }

            return baseDetails;
        }
        return null;
    }, [character, t, homeworldName, extra]);

    if (details === null || character === null) return null;


    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent
                        className="
                            rounded-3xl
                            max-w-sm md:max-w-lg lg:max-w-xl w-full max-h-[90vh] sm:max-h-[85vh] my-4
                            shadow-2xl shadow-black/20 dark:shadow-black/40
                            bg-gradient-to-br from-white via-white to-gray-50/80
                            dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/80
                            backdrop-blur-xl
                            border border-white/20 dark:border-gray-700/30
                            overflow-hidden
                            p-0
                            animate-in fade-in-0 zoom-in-95 duration-300
                        "
                    >
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent rounded-full blur-3xl" />
                        <button
                            onClick={onClose}
                            className="cursor-pointer -mt-2 -mr-1 absolute top-4 right-4 z-30 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 shadow-lg border border-gray-200/50 dark:border-gray-600/50"
                        >
                            <X className="cursor-pointer h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </button>

                        {showTopShadow && (
                            <div
                                className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-20 pointer-events-none transition-opacity duration-300"
                                style={{ opacity: topShadowOpacity, transitionDelay: '0.1s'}}
                            />
                        )}
                        {showBottomShadow && (
                            <div
                                className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-20 pointer-events-none transition-opacity duration-300"
                                style={{ opacity: bottomShadowOpacity, transitionDelay: '0.1s' }}
                            />
                        )}

                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="max-h-[65vh] sm:max-h-[70vh] md:max-h-[75vh] overflow-y-auto scrollbar-thin scroll-smooth overscroll-contain p-6 sm:p-8 md:p-10 touch-pan-y relative z-10"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain'
                            }}
                        >
                            <DialogHeader className="pb-6 mb-6 relative">
                                <div>
                                    <DialogTitle className="flex items-center justify-between text-3xl font-bold py-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                                        <span className="flex items-center gap-4">
                                            {character.name}
                                            <div className="animate-in zoom-in-0 duration-500">
                                                {isFavorite ? (
                                                    <Heart className="h-6 w-6 text-red-500 fill-current" />
                                                ) : (
                                                    <Heart className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                        </span>
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">
                                        {t("characterDetailsDescription", { name: character.name })}
                                    </DialogDescription>
                                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full mt-4 animate-pulse" />
                                </div>
                            </DialogHeader>

                            <div className="grid gap-5 mt-6">
                                {details.map((detail, index) => (
                                    <DetailCard key={index} detail={detail} t={t} index={index} />
                                ))}
                            </div>
                            {loadingExtra && (
                                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                                    <LoaderSpinner size="md" className="flex items-center justify-center p-6" />
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
};