import {useSwapiPeople} from '@/hooks/use-swapi';
import {UsersTable} from '../components/users/users-table';
import {LogWatcher} from '@/components/layout/log-watcher';
import {useTranslation} from 'react-i18next';
import {useState, useMemo, useEffect, useCallback} from "react";
import {useFavorites} from "@/hooks/use-favorites";
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
import { LoaderSpinner } from "@/components/layout/loader-spinner";
import {useQueryClient} from "@tanstack/react-query";

const ITEMS_PER_PAGE = 5;

const Users = () => {
    const {data, isLoading, isRefetching, totalExpectedCharacters, isLoadingTotalRecords} = useSwapiPeople();
    const queryClient = useQueryClient();

    const {t} = useTranslation();
    const [activeTab, setActiveTab] = useState("all");
    const {favorites, favoritesArray, toggleFavorite, clearAll} = useFavorites();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterText, setFilterText] = useState("");
    const [selectedCharacter, setSelectedCharacter] = useState<Person | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isProcessingRefetch, setIsProcessingRefetch] = useState(false);

    const shouldShowRefetchButton = useMemo(() => {
        return !isLoading && !isRefetching && data !== undefined && totalExpectedCharacters !== undefined && totalExpectedCharacters > data.length
            && !isLoadingTotalRecords;
    }, [isLoading, isRefetching, data, totalExpectedCharacters, isLoadingTotalRecords]);

    const handleRefetch = useCallback(async () => {
        setIsProcessingRefetch(true);
        try {
            localStorage.removeItem("swapi-people-data");
            localStorage.removeItem("swapi-people-timestamp");
            await queryClient.invalidateQueries({ queryKey: ["swapi-people"] });
            await queryClient.fetchQuery({ queryKey: ["swapi-people"] });
        } catch(error) {
            console.error("Error during refetch:", error);
        } finally {
            setIsProcessingRefetch(false);
        }
    }, [queryClient]);

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
                            <LogWatcher className="h-[300px]"/>
                        </div>
                    ) : (
                        <>
                            <UsersTable data={data || []}/>
                            {shouldShowRefetchButton && (
                                <div className="mt-6 text-center">
                                    <Button
                                        onClick={handleRefetch}
                                        disabled={isRefetching}
                                        className="cursor-pointer font-semibold hover:scale-[0.98] active:scale-[0.96] transistion-transform text-sm sm:text-base"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> {t("refetchData")}
                                        {isRefetching && <LoaderSpinner size="sm" className="ml-2"/>}
                                    </Button>
                                    <p className="text-sm font-semibold text-gray-500 mt-2">
                                        {t("totalRecords", {count: data?.length || 0, total: totalExpectedCharacters })}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="favorites" className="mt-6">
                    {isLoading ? (
                        <div className="p-4 text-center">
                            <LogWatcher className="h-[300px]"/>
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
                                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white/80 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-900/50 shadow-2xl shadow-blue-500/10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5" />
                                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent" />
                                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent rounded-full" />

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
                                                    onClick={clearAll}
                                                >
                                                    {!isMobile ? (<div className="flex items-center gap-1 col-span-2 text-destructive animate-pulse">{t('clearAll')}<Trash2 className="h-4 w-4"/></div>) : <Trash2 className="h-4 w-4 text-destructive animate-pulse"/>}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full mt-4" />
                                    </CardHeader>

                                    {favoritesArray.length === 0 ? (
                                        <CardContent className="py-4 text-center text-muted-foreground border-t relative z-10">
                                            {t('noFavorites')}
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
                                                                className="group relative overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer px-4 py-3 hover:bg-gradient-to-br hover:from-white/90 hover:to-gray-50/60 dark:hover:from-gray-800/90 dark:hover:to-gray-900/60 border-l-2 border-l-transparent hover:border-l-blue-500"
                                                                title={t('clickToViewDetails')}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300" />
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div className="w-[90%] overflow-x-auto scrollbar-thin pr-4 pb-3" style={{ scrollBehavior: "smooth" }}>
                                                                        <div className="grid grid-flow-col auto-cols-[minmax(200px,1fr)] gap-6 min-w-max">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                    <User className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-gradient-to-r text-sm md:text-md from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 font-[500] border-0 shadow-sm group-hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20 transition-all duration-300"
                                                                                >
                                                                                    {person.name}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                    <Palette className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-gradient-to-r text-sm md:text-md from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 font-medium border-0 shadow-sm group-hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20 transition-all duration-300"
                                                                                >
                                                                                    {person.gender === "n/a"
                                                                                        ? person.gender.toUpperCase()
                                                                                        : (["male", "female", "hermaphrodite", "none"].includes(person.gender)
                                                                                            ? t(person.gender).charAt(0).toUpperCase() + t(person.gender).slice(1).toLowerCase()
                                                                                            : t("unknown"))}
                                                                                </Badge>
                                                                            </div>
                                                                            {person.birth_year && (
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                        <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                                                                                    </div>
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="bg-gradient-to-r text-sm md:text-md from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 font-medium border-0 shadow-sm group-hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20 transition-all duration-300"
                                                                                    >
                                                                                        {person.birth_year}
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
                                                                                        className="bg-gradient-to-r text-sm md:text-md from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 font-medium border-0 shadow-sm group-hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20 transition-all duration-300"
                                                                                    >
                                                                                        {person.height} cm
                                                                                    </Badge>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="cursor-pointer h-7 w-7 p-0 opacity-70 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all relative z-10"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const id = person.url?.split('/').slice(-1)[0];
                                                                            if (id) toggleFavorite(id);
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
                                                <CardFooter className="mt-20 flex justify-between items-center px-4 py-2 border-t border-white/20 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/80 to-white/50 dark:from-gray-800/80 dark:to-gray-900/50 relative z-10">
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