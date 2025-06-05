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
import {cn} from "@/lib/utils.ts";

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

const ICON_SIZE = 16;
const SHADOW_FADE_ZONE = 50;
const MODAL_BREAKPOINTS = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-xl',
} as const;
const MODAL_HEIGHTS = {
    mobile: 'max-h-[90vh]',
    desktop: 'max-h-[85vh]',
};

const ICON_MAP = {
    user: User,
    calendar: Calendar,
    ruler: Ruler,
    eye: Eye,
    palette: Palette,
    weight: Weight,
    home: Home,
    clapperboard: Clapperboard,
    car: Car,
    dna: Dna,
    rocket: Rocket,
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        transition: (index: number) =>({
            duration: 0.3,
            delay: index * 0.03,
            ease: "easeOut",
        })
    },
    exit: { opacity: 0, y: -20, scale: 0.95 }
}
const fetchWithErrorHandling = async (url: string) => {
    try {
        console.log(`Fetching data from URL: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
            new Error(`Failed to fetch: ${res.statusText}`);
        }
        return await res.json();
    } catch(error) {
        console.error(`Error fetching data from URL: ${url}:  ${error}`);
        throw error;
    }
}
const useHomeWorld = (url: string | null) => {
    const { t } = useTranslation();
    return useQuery<string | null>({
        queryKey: ['homeworld', url],
        queryFn: async () => {
            if (!url) {
                return t("unknown");
            }
            try {
                const data = await fetchWithErrorHandling(url);
                const name = data.result?.properties?.name;
                return name === 'Unknown' ? t("unknown") : name || t("unknown");
            } catch (error) {
                console.error("Error fetching homeworld:", error, url);
                throw new Error(t("unknown")); // Propaga l'errore per gestione con useQuery
            }
        },
        enabled: !!url,
        // staleTime, gcTime, retry, retryDelay sono ereditati dai defaultOptions in main.tsx
    });
};

const useSwapiInfoDetails = (character: Person | null) => {
    const id = useMemo(() => character?.url.split("/").slice(-1)[0], [character?.url]);
    return useQuery<SwapiInfoExtra>({
        queryKey: ['swapi-info-person', id],
        queryFn: async () => {
            if (!id || !character) {
                throw new Error("character ID or data is not available");
            }
            const fetchDataFromUrls = async (urls: string[]) => {
                return Promise.all(
                    urls.map(async (url) => await fetchWithErrorHandling(url)));
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

const DetailCard: React.FC<{detail: DetailItem; t: (key: string) => string; index: number }> = React.memo(({ detail, t, index}) => {
    const Icon = detail.icon;

    return (
        <motion.div
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <Card className="group relative overflow-hidden backdrop-blur-0 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 border-transparent dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300" />
                <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-bold font-sans italic text-gray-600 dark:text-gray-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                            <Icon className={`h-${ICON_SIZE} w-${ICON_SIZE} text-blue-600 dark:text-blue-400`}/>
                        </div>
                        {detail.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 relative z-10">
                    <Badge
                        variant="secondary"
                        className="break-words whitespace-normal bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 capitalize text-sm px-4 py-2 font-medium border-0 shadow-sm group-hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20 transition-all duration-300"
                    >
                        {detail.value ?? t("unknown")}
                    </Badge>
                </CardContent>
            </Card>
        </motion.div>
    );
}, (prevProps, nextProps) =>{
    return (
        prevProps.detail.value === nextProps.detail.value &&
        prevProps.detail.label === nextProps.detail.label &&
        prevProps.index === nextProps.index
    );
});

const ModalShadows = ({ showTop, showBottom, topOpacity, bottomOpacity }: {
    showTop: boolean;
    showBottom: boolean;
    topOpacity: number;
    bottomOpacity: number;
}) => {
    return (
        <>
            {showTop && (
                <div
                    className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-20 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: topOpacity, transitionDelay: '0.1s'}}
                />
            )}
            {showBottom && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-20 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: bottomOpacity, transitionDelay: '0.1s' }}
                />
            )}
        </>
    );
};

export const CharacterDetailsModal = ({character, isOpen, onClose}: CharacterDetailsModalProps) => {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);
    const [topShadowOpacity, setTopShadowOpacity] = useState(0);
    const [bottomShadowOpacity, setBottomShadowOpacity] = useState(0);
    const { favorites } = useFavorites();
    const { data: extra, isLoading: loadingExtra} = useSwapiInfoDetails(character);
    const { data: homeworldName, isLoading: homeworldLoading } = useHomeWorld(character?.homeworld ?? null);

    const isFavorite = useMemo(() => {
        if(!character?.url) return false;
        const characterId = character.url.split("/").slice(-1)[0];
        return !!favorites[characterId];
    }, [character?.url, favorites]);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const scrollBottom = scrollHeight - clientHeight - scrollTop;
        const isScrollable = scrollHeight > clientHeight;
        // console.log(
        //     'ScrollTop:', el.scrollTop,
        //     'ScrollHeight:', el.scrollHeight,
        //     'ClientHeight:', el.clientHeight,
        //     'In fondo?', el.scrollTop + el.clientHeight >= el.scrollHeight - 1
        // );
        if (isScrollable && !(scrollTop <= 0)) {
            setShowTopShadow(true);
            setTopShadowOpacity(Math.min(1, scrollTop / SHADOW_FADE_ZONE));
        } else {
            setShowTopShadow(false);
            setTopShadowOpacity(0);
        }
        if (isScrollable && scrollBottom > 0) {
            setShowBottomShadow(true);
            setBottomShadowOpacity(Math.min(1, scrollBottom / SHADOW_FADE_ZONE));
        } else {
            setShowBottomShadow(false);
            setBottomShadowOpacity(0);
        }
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleResizeAndScroll = () => handleScroll();
        const resizeObserver = new ResizeObserver(handleResizeAndScroll);
        resizeObserver.observe(el);

        if (isOpen && character) {
            el.scrollTop = 0;
            const observer = new MutationObserver(() => {
                requestAnimationFrame(handleResizeAndScroll);
            });
            observer.observe(el, { childList: true, subtree: true });

            const t1 = setTimeout(handleResizeAndScroll, 50);
            const t2 = setTimeout(handleResizeAndScroll, 300);

            return () => {
                resizeObserver.disconnect();
                observer.disconnect();
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [isOpen, character, handleScroll]);


    const details: (DetailItem[] | null) = useMemo(() => {
        if (!character) return null;
        const baseDetails: DetailItem[] = [
            {
                icon: ICON_MAP.user,
                label: t('name'),
                value: character.name,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.palette,
                label: t('gender'),
                value: !character.gender || character.gender === "n/a" || character.gender === "unknown" ? t("unknown") : character.gender === "none" ? t("none") : character.gender,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.calendar,
                label: t("birthYear"),
                value: !character.birth_year || character.birth_year === "n/a"  || character.birth_year === "unknown"? t("unknown") : character.birth_year === "none"  ? t("none") : character.birth_year,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.ruler,
                label: t("height"),
                value: !character.height || character.height === "n/a" || character.height === "unknown"? t("unknown") : character.height === "none"  ? t("none") : `${character.height} cm`,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.weight,
                label: t("mass"),
                value: !character.mass || character.mass === "n/a" || character.mass === "unknown" ? t("unknown") : character.mass === "none"  ? t("none") : `${character.mass} kg`,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.eye,
                label: t("eyeColor"),
                value: !character.eye_color || character.eye_color === "n/a" || character.eye_color === "unknown" ? t("unknown") : character.eye_color === "none"  ? t("none") : character.eye_color,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.palette,
                label: t("hairColor"),
                value: !character.hair_color || character.hair_color === "n/a" || character.hair_color === "unknown" ? t("unknown") : character.hair_color === "none"  ? t("none") : character.hair_color,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.palette,
                label: t("skinColor"),
                value: !character.skin_color || character.skin_color === "n/a" || character.skin_color === "unknown" ? t("unknown") : character.skin_color === "none"  ? t("none") : character.skin_color,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            },
            {
                icon: ICON_MAP.home,
                label: 'Homeworld',
                value: homeworldLoading ? t("loading") : homeworldName ?? null,
                color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
            }
        ];
        if (extra) {
            if (extra?.films && extra.films.length > 0) {
                baseDetails.push({
                    icon: ICON_MAP.clapperboard,
                    label: t("films"),
                    value: extra.films.map(film => film.title).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }

            if (extra?.vehicles && extra.vehicles.length > 0) {
                baseDetails.push({
                    icon: ICON_MAP.car,
                    label: t("vehicles"),
                    value: extra.vehicles.map(vehicle => vehicle.name).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }
            if (extra?.species && extra.species.length > 0) {
                baseDetails.push({
                    icon: ICON_MAP.dna,
                    label: t("species"),
                    value: extra.species.map(s => s.name).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }
            if (extra?.starships && extra.starships.length > 0) {
                baseDetails.push({
                    icon: ICON_MAP.rocket,
                    label: t("starships"),
                    value: extra.starships.map(starship => starship.name).join(", "),
                    color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
                });
            }
        }

        return baseDetails;

    }, [character, t, homeworldName, homeworldLoading, extra]);

    if (!details || !character || !isOpen) return null;


    return (
        <AnimatePresence>
            <Dialog open={isOpen} onOpenChange={(open) => {
                if(!open) {
                    onClose();
                    console.clear();
                }
                setShowTopShadow(false);
            }}>
                <DialogContent
                    className={cn(
                        "rounded-3xl w-full my-4 shadow-2xl shadow-black/20 dark:shadow-black/40",
                        "bg-gradient-to-br from-white via-white to-gray-50/80 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/80",
                        "border border-white/20 dark:border-gray-700/30 overflow-hidden p-0",
                        "animate-in fade-in-0 zoom-in-95 duration-250 ease-in-out",
                        MODAL_BREAKPOINTS.sm,
                        MODAL_BREAKPOINTS.md,
                        MODAL_BREAKPOINTS.lg,
                        MODAL_HEIGHTS.mobile,
                        MODAL_HEIGHTS.desktop
                    )}
                >
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent rounded-full" />

                    <button
                        onClick={onClose}
                        className={cn(
                            "cursor-pointer absolute top-4 right-4 z-30 p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-lg",
                            "bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700",
                            "border border-gray-200/50 dark:border-gray-600/50",
                            "-mt-2 -mr-1"
                        )}
                        aria-label={t("closeCharacterDetails")}
                    >
                        <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>

                    <ModalShadows
                        showTop={showTopShadow}
                        showBottom={showBottomShadow}
                        topOpacity={topShadowOpacity}
                        bottomOpacity={bottomShadowOpacity}
                    />

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
                                            <Heart className={`h-6 w-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
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
                                <DetailCard key={`${detail.label}-${index}`} detail={detail} t={t} index={index} />
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
        </AnimatePresence>
    );
};