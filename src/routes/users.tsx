import {useSwapiPeople} from '@/hooks/use-swapi';
import {UsersTable} from '../components/users/users-table';
import {LogWatcher} from '@/components/layout/log-watcher';
import {useTranslation} from 'react-i18next';
import {useState, useMemo, useEffect, useCallback} from "react";
import {useFavoritesPeople} from "@/hooks/use-favorites";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@radix-ui/react-tabs";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@radix-ui/react-scroll-area";
import {X, ChevronLeft, ChevronRight, Palette, Calendar, User, Ruler, Trash2} from "lucide-react";
import {Input} from "@/components/ui/input";
import { CharacterDetailsModal } from '@/components/users/character-details-modal';
import type {Person} from "@/types";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { usePeopleLogWatcher } from '@/context/log-watcher-instances';
import {useQueryClient} from "@tanstack/react-query";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
const ITEMS_PER_PAGE = 5;

const Users = () => {
    const {data, isLoading, isRefetching, totalExpectedCharacters, isLoadingTotalRecords} = useSwapiPeople();
    const queryClient = useQueryClient();
    const {t} = useTranslation();
    const [activeTab, setActiveTab] = useState("all");
    const {favorites, favoritesArray, toggleFavoritePeople, clearAll} = useFavoritesPeople();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterText, setFilterText] = useState("");
    const [selectedCharacter, setSelectedCharacter] = useState<Person | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isProcessingRefetch, setIsProcessingRefetch] = useState(false);
    const { resetLogWatcher } = usePeopleLogWatcher();

    const shouldShowRefetchButton = useMemo(() => {
        return !isLoading && !isRefetching && data !== undefined && totalExpectedCharacters !== undefined && !isLoadingTotalRecords;
    }, [isLoading, isRefetching, data, totalExpectedCharacters, isLoadingTotalRecords]);

    const handleRefetch = useCallback(async () => {
        console.clear();
        resetLogWatcher();
        setIsProcessingRefetch(true);
        try {
            queryClient.removeQueries({queryKey: ["swapi-people"]});
            queryClient.removeQueries({queryKey: ["favorites"]});
            queryClient.removeQueries({ queryKey: ["swapi-people-total-records"] });
            queryClient.removeQueries({ queryKey: ['swapi-info-person'], exact: false });
            queryClient.removeQueries({ queryKey: ["homeworld"], exact: false});
            await queryClient.invalidateQueries({ queryKey: ["swapi-people"] });
            await queryClient.fetchQuery({ queryKey: ["swapi-people"] });
        } catch(error) {
            console.error("Error during refetch:", error);
        } finally {
            setTimeout(() => {
                setIsProcessingRefetch(false);
            }, 500);
        }
    }, [queryClient, resetLogWatcher]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const favoriteUsers = useMemo(() => {
        return data?.filter(user => {
            const id = user.url?.split('/').slice(-1)[0];
            if (!id || !favorites[id]) return false;
            if (!filterText) return true;
            const searchTerm = filterText.toLowerCase();
            return (
                (user.name?.toLowerCase().includes(searchTerm)) ||
                (user.gender?.toLowerCase().includes(searchTerm)) ||
                (user.birth_year?.toLowerCase().includes(searchTerm)) ||
                (user.height?.toLowerCase().includes(searchTerm))
            );
        }) || [];
    }, [data, favorites, filterText]);

    const handleRowClick = useCallback((character: Person)=> {
        setSelectedCharacter(character);
        setIsModalOpen(true);
    },[]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCharacter(null);
    }, []);

    const totalPages = useMemo(() => Math.ceil(favoriteUsers.length / ITEMS_PER_PAGE), [favoriteUsers.length]);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedFavorites = useMemo(() => favoriteUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE), [favoriteUsers, startIndex]);

    const nextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const prevPage = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []);

    const handleFilterChange = useCallback((input: string) => {
        const filtered = input.replace(/[^\w\s-/]/gi, '');
        setFilterText(filtered);
        setCurrentPage(1);
    }, []);

    useEffect(() => {
        const newTotalPages = Math.ceil(favoriteUsers.length / ITEMS_PER_PAGE);
        if (favoriteUsers.length === 0) {
            setCurrentPage(1);
            return;
        }
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const elementsInCurrentPage = favoriteUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE).length;
        
        if(elementsInCurrentPage === 0 && currentPage > 1) {
            setCurrentPage(prev => Math.max(prev - 1, 1));
        } else if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }

    }, [favoriteUsers.length, currentPage, favoriteUsers]);

    const handleRemoveFavorite = useCallback((personId: string) => {
        toggleFavoritePeople(personId);
    }, [toggleFavoritePeople]);

    const handleClearAll = useCallback(() => {
        clearAll();
        setFilterText('');
        setCurrentPage(1);
    }, [clearAll]);

    return (
        <div className="flex flex-col p-8 pt-6 space-y-6">
            <div className="flex justify-center items-center">
                <h2 className="text-3xl font-bold tracking-tight text-center">{t('usersPageTitle')}</h2>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 flex flex-wrap sm:flex-nowrap">
                    <TabsTrigger
                        value="all"
                        className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current px-4 pb-3 pt-2 -mb-px text-sm sm:text-base whitespace-nowrap sm:flex-none flex-1"
                    >
                        {t("allCharacters")}
                    </TabsTrigger>
                    <TabsTrigger
                        value="favorites"
                        className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current px-4 pb-3 pt-2 -mb-px text-sm sm:text-base whitespace-nowrap sm:flex-none flex-1"
                    >
                        {t("favorites")}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                    {isLoading || isProcessingRefetch ? (
                        <div className="p-4 text-center">
                            <LogWatcher className="h-[300px]" useWatcherHook={usePeopleLogWatcher}/>
                        </div>
                    ) : (
                        <>
                            <UsersTable data={data || []}/>
                            {shouldShowRefetchButton && (
                                <div className="mt-6 text-center">
                                    <Tooltip delayDuration={200}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={handleRefetch}
                                                className="cursor-pointer font-semibold hover:scale-[0.98] active:scale-[0.96] transistion-transform text-sm sm:text-base"
                                            >
                                                <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> {t("refetchData")}
                                            </Button>
                                        </TooltipTrigger>
                                            <p className="text-sm font-semibold text-gray-500 mt-2">
                                                {t("totalRecords", {count: data?.length || 0, total: totalExpectedCharacters })}
                                            </p>
                                        <TooltipContent side="top" sideOffset={8} className="rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-xs">
                                            <p>{t("refetchDataTooltip")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="favorites" className="mt-6">
                    {isLoading ? (
                        <div className="p-4 text-center">
                            <LogWatcher className="h-[300px]" useWatcherHook={usePeopleLogWatcher}/>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {favoritesArray.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Input
                                            placeholder={t("generalFilter")}
                                            className="max-w-sm"
                                            onChange={(e) => {
                                                handleFilterChange(e.target.value);
                                            }}
                                            value={filterText}
                                        />
                                    </div>

                                    {filterText && (
                                        <div
                                            className="mb-2 text-xs sm:text-sm flex items-center justify-between px-1 text-muted-foreground animate-fade-in truncate">
                                            <span className={favoriteUsers.length === 0 ? 'text-destructive' : ''}>
                                                {favoriteUsers.length > 0
                                                    ? t('matchesFound', {count: favoriteUsers.length})
                                                    : t('noResultsFound')}
                                            </span>

                                            <Button className="cursor-pointer text-xs sm:text-sm" variant="ghost" size="sm"
                                                    onClick={() => setFilterText('')}>
                                                {t("clearFilter")}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {!(filterText && favoriteUsers.length === 0) && (
                                <Card className="relative overflow-hidden border-0 bg-white dark:bg-gray-950 shadow-sm transition-all duration-300 hover:shadow-md">
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-100/10 dark:to-blue-900/10" />
                                    <CardHeader className="pb-2 px-4 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xl font-bold tracking-tight px-0">
                                                <span className="-mt-5 flex items-center gap-3 text-gray-900 dark:text-white">
                                                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 transition-all duration-300 mt-1 -ml-2">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                                    </div>
                                                    <span className={isMobile ? "-ml-1 text-base" : "-ml-1"}>{t('favorites')}</span>
                                                </span>
                                            </CardTitle>
                                            {favoritesArray.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="border-none cursor-pointer h-8 -mr-3 -mt-4 px-2 hover:bg-destructive/10 hover:text-destructive text-xs sm:text-sm sm:px-4 relative z-10 transition-all duration-300 ease-in-out"
                                                    onClick={handleClearAll}
                                                >
                                                    {!isMobile ? (<div className="flex items-center gap-1 col-span-2 text-destructive animate-pulse hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100">{t('clearAll')}<Trash2 className="h-4 w-4 hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100"/></div>) : <Trash2 className="h-4 w-4 text-destructive animate-pulse hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100"/>}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full mt-4" />
                                    </CardHeader>

                                    {favoritesArray.length === 0 ? (
                                        <CardContent className="flex items-center justify-center p-6 text-center border-t">
                                            <p className="text-lg font-bold">{t('noFavorites')}</p>
                                        </CardContent>
                                    ) : (
                                        <>
                                            <CardContent className="pt-0 pb-0 px-0 relative z-10">
                                                <ScrollArea className="max-h-[220px]">
                                                    <ul className="divide-y divide-border/30">
                                                        {paginatedFavorites.map((person) => (
                                                            <li
                                                                key={person.url}
                                                                onClick={() => handleRowClick(person)}
                                                                className="group relative overflow-hidden transition-all duration-300 ease-out hover:shadow-sm hover:-translate-y-0.5 cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-l-transparent hover:border-l-blue-500"
                                                                title={t('clickToViewDetails')}
                                                            >
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div className="w-[90%] overflow-x-auto scrollbar-thin pr-4 pb-3" style={{ scrollBehavior: "smooth" }}>
                                                                        <div className="grid grid-flow-col auto-cols-[minmax(200px,1fr)] gap-6 min-w-max">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                    <User className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-[500] border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300"
                                                                                >
                                                                                    <span className="font-semibold">{person.name}</span>
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                    <Palette className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300"
                                                                                >
                                                                                    <span className="font-semibold">{person.gender === "n/a"
                                                                                        ? person.gender.toUpperCase()
                                                                                        : (["male", "female", "hermaphrodite", "none"].includes(person.gender)
                                                                                            ? t(person.gender).charAt(0).toUpperCase() + t(person.gender).slice(1).toLowerCase()
                                                                                            : t("unknown"))}</span>
                                                                                </Badge>
                                                                            </div>
                                                                            {person.birth_year && (
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                        <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                                                                                    </div>
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300"
                                                                                    >
                                                                                        <span className="font-semibold">{person.birth_year}</span>
                                                                                    </Badge>
                                                                                </div>
                                                                            )}
                                                                            {person.height && (
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                        <Ruler className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                                                                                    </div>
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300"
                                                                                    >
                                                                                        <span className="font-semibold">{person.height} cm</span>
                                                                                    </Badge>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="cursor-pointer h-7 w-7 p-0 opacity-70 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100 relative z-10"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const id = person.url?.split('/').slice(-1)[0];
                                                                            if (id) {
                                                                               handleRemoveFavorite(id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <X className={`h-3.5 w-3.5 transition duration-300 ease-in-out ${isMobile ? "text-destructive animate-pulse" : "text-destructive"}`}/>
                                                                        <span className="sr-only">{t('removeFromFavorites')}</span>
                                                                    </Button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                            </CardContent>

                                            {favoriteUsers.length >= ITEMS_PER_PAGE && (
                                                <CardFooter className="mt-20 flex justify-between items-center px-4 py-2 border-t relative z-10">
                                                    <div className="text-xs text-gray-600 dark:text-gray-300 font-bold">
                                                        {t("pageInfo", {
                                                            current: `${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, favoriteUsers.length)}`,
                                                            total: favoriteUsers.length
                                                        })}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200"
                                                            disabled={currentPage === 1}
                                                            onClick={prevPage}
                                                        >
                                                            <ChevronLeft className="h-4 w-4"/>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200"
                                                            disabled={currentPage === totalPages}
                                                            onClick={nextPage}
                                                        >
                                                            <ChevronRight className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </CardFooter>
                                            )}
                                        </>
                                    )}
                                </Card>
                            )}

                            {favoriteUsers.length > 0 && (
                                <div className="mt-6">
                                    <UsersTable data={favoriteUsers}/>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            <CharacterDetailsModal
                character={selectedCharacter}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default Users;