import { useSwapiPeople } from '@/hooks/use-swapi';
import { LogWatcher } from '@/components/layout/log-watcher';
import { useTranslation } from 'react-i18next';
import {useState, useMemo, useEffect, useCallback, useRef} from "react";
import { useFavoritesPeople } from "@/hooks/use-favorites";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {X, ChevronLeft, ChevronRight, Palette, Calendar, User, Ruler, Trash2, Eraser, Download} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CharacterDetailsModal } from '@/components/users/character-details-modal';
import type { Person } from "@/types";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { usePeopleLogWatcher } from '@/hooks/use-people-log-watcher';
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearch, useNavigate } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table';
import { columns, fuzzyFilter } from '@/components/users/columns';
import {toast} from "sonner";
import i18n from "i18next";
import {exportCsv, exportToJson} from "@/utils/export.ts";


const ITEMS_PER_PAGE_FAVORITES = 10;


const Users = () => {
    const { t } = useTranslation();
    const navigate = useNavigate({ from: '/characters' });
    const { page: pagePeople, limit } = useSearch({ from: '/characters' });
    const page = useMemo(() => Number(pagePeople) || 1, [pagePeople]);
    const { people, totalPeople, totalPages, isLoading, isRefetching } = useSwapiPeople(page, limit);
    const queryClient = useQueryClient();
    const { resetLogWatcher } = usePeopleLogWatcher();
    const seenPeopleRef = useRef<Map<string, Person>>(new Map());
    const fetchedPagesRef = useRef(new Set());
    const previousPageRef = useRef(page);
    const [seenPeopleCount, setSeenPeopleCount] = useState(0);
    const [activeTab, setActiveTab] = useState("all");
    const { favorites, favoritesArray, toggleFavoritePeople, clearAll, clearCurrentPageFavorites } = useFavoritesPeople();
    const [currentPageFavorites, setCurrentPageFavorites] = useState(1);
    const [filterTextFavorites, setFilterTextFavorites] = useState("");
    const [selectedCharacter, setSelectedCharacter] = useState<Person | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [globalFilterPeople, setGlobalFilterPeople] = useState('');
    const [goToPageInput, setGoToPageInput] = useState('');

    // useEffect(() => {
    //     console.log("Starships Component mounted/updated.");
    //     console.log("Current i18n language:", i18n.language);
    //     console.log("i18n interpolation settings:", i18n.options.interpolation);
    //
    //     const currentLangBundle = i18n.getResourceBundle(i18n.language, 'translation');
    //     console.log("i18n bundle 'noResultsFound' key:", currentLangBundle?.noResultsFound);
    //     console.log("Type of 'page' from useSearch:", typeof page, "Value:", page);
    //
    // }, [page]);

    const getOrdinalSuffix = useCallback((num: number): string => {
        const s = ["th", "st", "nd", "rd"];
        const v = num % 100;
        return (s[(v - 20) % 10] || s[v] || s[0]);
    }, []);

    const interpolatedPage = useCallback(() => {
        return i18n.language !== "en" ? page : `${page}${getOrdinalSuffix(page)}`;
    }, [getOrdinalSuffix, page]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const idPeopleArrCurrentPage = useCallback(() => {
        return people?.map(person => {
            if (!person.url) return null;
            const id = person.url.split("/").pop();
            return id ?? null;
        }).filter(Boolean) as string[] || [];
    }, [people]);

    const hasFavoriteInCurrentPage = useMemo(() => {
        const currentIds = idPeopleArrCurrentPage();
        return currentIds.some(id => favoritesArray.includes(id));
    }, [idPeopleArrCurrentPage, favoritesArray]);

    useEffect(() => {
        const pageKey = `${page}-${limit}`;
        const wasPageFetched = fetchedPagesRef.current.has(pageKey);
        const pageChanged = previousPageRef.current !== page;
        if(!wasPageFetched || pageChanged) {
            resetLogWatcher();
            seenPeopleRef.current = new Map();
            fetchedPagesRef.current = new Set();
            setSeenPeopleCount(0);
        }

        if(people && !isLoading) {
            fetchedPagesRef.current.add(pageKey);
            people.forEach(person => {
                const id = person.url?.split("/").slice(-1)[0];
                if (id && !seenPeopleRef.current.has(id)) {
                    seenPeopleRef.current.set(id, person);
                }
            })
            setSeenPeopleCount(seenPeopleRef.current.size);
        }
        previousPageRef.current = page;
    }, [page, limit, people, isLoading, resetLogWatcher]);

    const allPagesFetched = useMemo(() => {
        if(!totalPages) return false;
        for (let i = 1; i <= totalPages; i++) {
            const pageKey = `${i}-${limit}`;
            if (!fetchedPagesRef.current.has(pageKey)) {
                return false;
            }
        }
        return true;
    }, [totalPages, limit]);

    const handleRefetch = useCallback(async () => {
        resetLogWatcher();
        setGoToPageInput('');
        if(hasFavoriteInCurrentPage) {
            clearCurrentPageFavorites(idPeopleArrCurrentPage());
            setFilterTextFavorites('');
            setCurrentPageFavorites(1);
        }
        seenPeopleRef.current = new Map();
        fetchedPagesRef.current = new Set();
        setSeenPeopleCount(0);
        const pageKey = `${page}-${limit}`;
        fetchedPagesRef.current.delete(pageKey);
        if(allPagesFetched) {
            setFilterTextFavorites('');
            setCurrentPageFavorites(1);
        }
        try {
            await queryClient.refetchQueries({
                queryKey: ["swapi-people", page, limit],
                exact: true,
                type: 'active'
            });
        } catch (error) {
            console.error("Error during refetch:", error);
        }
    }, [resetLogWatcher, hasFavoriteInCurrentPage, page, limit, allPagesFetched, clearCurrentPageFavorites, idPeopleArrCurrentPage, queryClient]);

    const favoriteUsers = useMemo(() => {
        return people?.filter(user => {
            const id = user.url?.split('/').slice(-1)[0];
            if (!id || !favorites[id]) return false;
            if (!filterTextFavorites) return true;
            const searchTerm = filterTextFavorites.toLowerCase();
            return (
                (user.name?.toLowerCase().includes(searchTerm)) ||
                (user.gender?.toLowerCase().includes(searchTerm)) ||
                (user.birth_year?.toLowerCase().includes(searchTerm)) ||
                (user.height?.toLowerCase().includes(searchTerm))
            );
        }) || [];
    }, [people, favorites, filterTextFavorites]);


    const handleRowClick = useCallback((character: Person) => {
        setSelectedCharacter(character);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCharacter(null);
    }, []);

    const totalPagesFavorites = useMemo(() => Math.ceil(favoriteUsers.length / ITEMS_PER_PAGE_FAVORITES), [favoriteUsers.length]);
    const startIndexFavorites = (currentPageFavorites - 1) * ITEMS_PER_PAGE_FAVORITES;
    const paginatedFavorites = useMemo(() => favoriteUsers.slice(startIndexFavorites, startIndexFavorites + ITEMS_PER_PAGE_FAVORITES), [favoriteUsers, startIndexFavorites]);

    const nextPageFavorites = useCallback(() => {
        setCurrentPageFavorites(prev => Math.min(prev + 1, totalPagesFavorites));
    }, [totalPagesFavorites]);

    const prevPageFavorites = useCallback(() => {
        setCurrentPageFavorites(prev => Math.max(prev - 1, 1));
    }, []);

    const handleFilterChangeFavorites = useCallback((input: string) => {
        const filtered = input.replace(/[^\w\s-/]/gi, '');
        setFilterTextFavorites(filtered);
        setCurrentPageFavorites(1);
    }, []);

    useEffect(() => {
        const newTotalPages = Math.ceil(favoriteUsers.length / ITEMS_PER_PAGE_FAVORITES);
        if (favoriteUsers.length === 0) {
            setCurrentPageFavorites(1);
            return;
        }
        const startIndex = (currentPageFavorites - 1) * ITEMS_PER_PAGE_FAVORITES;
        const elementsInCurrentPage = favoriteUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE_FAVORITES).length;

        if (elementsInCurrentPage === 0 && currentPageFavorites > 1) {
            setCurrentPageFavorites(prev => Math.max(prev - 1, 1));
        } else if (currentPageFavorites > newTotalPages && newTotalPages > 0) {
            setCurrentPageFavorites(newTotalPages);
        }

    }, [favoriteUsers.length, currentPageFavorites, favoriteUsers]);

    const handleRemoveFavorite = useCallback((personId: string) => {
        toggleFavoritePeople(personId);
    }, [toggleFavoritePeople]);

    const handleClearAllFavorites = useCallback(() => {
        clearAll();
        setFilterTextFavorites('');
        setCurrentPageFavorites(1);
    }, [clearAll]);

    const handleClearCurrentPageFavorites = useCallback(() => {
        const idsInCurrentPage = paginatedFavorites.map(p => p.url?.split('/').slice(-1)[0]).filter(Boolean) as string[];
        if (idsInCurrentPage.length > 0) {
            clearCurrentPageFavorites(idsInCurrentPage);
            setFilterTextFavorites('');
        }
    }, [paginatedFavorites, clearCurrentPageFavorites]);

    const goToNextPagePeople = useCallback(async () => {
        await navigate({ search: (oldSearch) => ({ ...oldSearch, page: oldSearch.page + 1 }) });
    }, [navigate]);

    const goToPreviousPagePeople = useCallback(async () => {
        await navigate({ search: (oldSearch) => ({ ...oldSearch, page: Math.max(1, oldSearch.page - 1) }) });
    }, [navigate]);

    const handlePageSizeChangePeople = useCallback(async (newSize: number) => {
        await navigate({ search: (oldSearch) => ({ ...oldSearch, limit: newSize, page: 1 }) });
    }, [navigate]);

    const goToSpecificPagePeople = useCallback(async () => {
       const pageNumber = parseInt(goToPageInput);
       if(pageNumber > 0 && totalPages !== undefined && pageNumber <= totalPages && pageNumber !== page) {
              await navigate({ search: (oldSearch) => ({ ...oldSearch, page: pageNumber }) });
              setGoToPageInput('');
       } else if (pageNumber === page) {
                console.warn(`Already on page ${pageNumber}. Total pages: ${totalPages}`);
                toast.error(t('alreadyOnPage', { page: pageNumber, total: totalPages }));
                setGoToPageInput('');
       } else {
              console.warn(`Invalid page number: ${pageNumber}. Total pages: ${totalPages}`);
              toast.error(t('invalidPageNumber', { page: isNaN(pageNumber) ? '' : pageNumber , total: totalPages }));
              setGoToPageInput('');
       }
    }, [goToPageInput, navigate, page, t, totalPages]);

    const canNextPagePeople = useMemo(() => {
        if (totalPeople === undefined || limit === undefined) return false;
        return (page * limit) < totalPeople;
    }, [page, limit, totalPeople]);

    const canPreviousPagePeople = page > 1;

    const handleExportPeopleOrFavorites = useCallback((format: 'csv' | 'json', peopleOrFavorites: 'people' | 'favorites') => {
        const dataPeopleToExport = peopleOrFavorites === 'people' ?  people : paginatedFavorites;
        if(dataPeopleToExport.length === 0){
            toast.info(t('noDataToExport'));
            return;
        }
        const filenamePeople = peopleOrFavorites === 'people' ? `${t('people')}_page_${page}` : `${t('favorites')}_page_${currentPageFavorites}`;
        if(format === 'csv') {
            exportCsv(dataPeopleToExport, filenamePeople);
            toast.success(t('exportSuccess', { format: 'CSV', filename: filenamePeople }));
        }else {
            exportToJson(dataPeopleToExport, filenamePeople);
            toast.success(t('exportSuccess', { format: 'JSON', filename: filenamePeople }));
        }
    }, [people, paginatedFavorites, t, page, currentPageFavorites]);

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
                    {isLoading || isRefetching ? (
                        <div className="p-4 text-center">
                            <LogWatcher className="h-[300px]" useWatcherHook={usePeopleLogWatcher} />
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center w-full mb-4">
                                {totalPages !== undefined && totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={totalPages}
                                                        value={goToPageInput}
                                                        placeholder={t("goToPagePlaceholder", { total: totalPages })}
                                                        onChange={(e) => setGoToPageInput(e.target.value)}
                                                        className="cursor-pointer
                                                            w-20 sm:w-24 md:w-28
                                                            text-center
                                                            rounded-r-none
                                                            focus-visible:ring-offset-0 focus-visible:ring-0
                                                            appearance-none
                                                            [&::-webkit-outer-spin-button]:appearance-none
                                                            [&::-webkit-inner-spin-button]:appearance-none
                                                            [-moz-appearance:textfield]
                                                            text-sm sm:text-base
                                                            h-9 sm:h-10
                                                            py-1 sm:py-2"
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter') {
                                                                await goToSpecificPagePeople();
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        onClick={goToSpecificPagePeople}
                                                        disabled={!goToPageInput || isNaN(parseInt(goToPageInput)) || parseInt(goToPageInput) < 1 || (parseInt(goToPageInput) > totalPages) || isLoading || isRefetching}
                                                        className="cursor-pointer
                                                            rounded-l-none
                                                            font-semibold
                                                            hover:scale-[0.98] active:scale-[0.96] transition-transform
                                                      text-sm sm:text-base
                                                            h-9 sm:h-10
                                                      px-3 sm:px-4"
                                                    >
                                                        {t("goToPageButton")}
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" sideOffset={8} className="whitespace-nowrap max-w-md rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
                                                <p>{t('goToPageTooltip', { total: totalPages })}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 mt-3">
                                    <Button
                                        onClick={() => handleExportPeopleOrFavorites('csv', 'people')}
                                        variant="ghost"
                                        size="sm"
                                        disabled={people.length === 0}
                                        className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
                                    >
                                        <Download className="mr-2 h-4 w-4"/> {t("exportToCSV")}
                                    </Button>
                                    <Button
                                        onClick={() => handleExportPeopleOrFavorites('json', 'people')}
                                        variant="ghost"
                                        size="sm"
                                        disabled={people.length === 0}
                                        className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
                                    >
                                        <Download className="mr-2 h-4 w-4"/> {t("exportToJson")}
                                    </Button>
                                </div>
                            </div>

                            <DataTable
                                data={people || []}
                                columns={columns}
                                globalFilterFn={fuzzyFilter}
                                filterPlaceholder={t("filterCharacters")}
                                onRowClick={handleRowClick}
                                clickDetailsTooltip={t('clickToViewDetails')}
                                serverPagination={{
                                    pageIndex: page - 1,
                                    pageSize: limit,
                                    pageCount: totalPages !== undefined ? totalPages : -1,
                                    canNextPage: canNextPagePeople,
                                    canPreviousPage: canPreviousPagePeople,
                                    nextPage: goToNextPagePeople,
                                    previousPage: goToPreviousPagePeople,
                                    setPageSize: handlePageSizeChangePeople,
                                    totalRows: totalPeople,
                                    currentPageForDisplay: page,
                                }}
                                globalFilterValue={globalFilterPeople}
                                onGlobalFilterChange={setGlobalFilterPeople}
                            />
                            {(people.length > 0 || globalFilterPeople) && (
                                <div className="mt-6 text-center">
                                    <Tooltip delayDuration={200}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={handleRefetch}
                                                className="cursor-pointer font-semibold hover:scale-[0.98] active:scale-[0.96] transition-transform text-sm sm:text-base"
                                                disabled={isRefetching}
                                            >
                                                <RotateCcw className='mr-2 h-4 w-4 animate-spin' /> {t("refetchData", {page: page})}
                                            </Button>
                                        </TooltipTrigger>
                                        <p className="text-sm font-semibold text-gray-500 mt-2">
                                            {t("totalRecords", { count: seenPeopleCount , total: totalPeople })}
                                        </p>
                                        <TooltipContent side="top" sideOffset={8} className="rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-xs">
                                            <p>{t("refetchDataTooltip", {page: page})}</p>
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
                            <LogWatcher className="h-[300px]" useWatcherHook={usePeopleLogWatcher} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center w-full mb-4">
                                {favoritesArray.length > 0 && hasFavoriteInCurrentPage && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 sm:gap-4">
                                            <Input
                                                placeholder={t("generalFilter")}
                                                className="max-w-sm"
                                                onChange={(e) => {
                                                    handleFilterChangeFavorites(e.target.value);
                                                }}
                                                value={filterTextFavorites}
                                            />
                                            {favoritesArray.length > 0 && hasFavoriteInCurrentPage && !filterTextFavorites && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="border-none cursor-pointer h-8 -mr-3 px-2 hover:bg-destructive/10 hover:text-destructive text-xs sm:text-sm sm:px-4 relative z-10 transition-all duration-300 ease-in-out"
                                                    onClick={handleClearAllFavorites}
                                                >
                                                    {!isMobile ? (<div className="flex items-center gap-1 col-span-2 text-destructive animate-pulse hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100">{t('clearAll')}<Trash2 className="h-4 w-4 hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100" /></div>) : <Trash2 className="h-4 w-4 text-destructive animate-pulse hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100" />}
                                                </Button>
                                            )}
                                        </div>
                                        {filterTextFavorites && (
                                            <div
                                                className="mb-2 text-xs sm:text-sm flex items-center justify-between px-1 text-muted-foreground animate-fade-in truncate">
                                                <span className={favoriteUsers.length === 0 ? 'text-destructive' : ''}>
                                                    {favoriteUsers.length > 0
                                                        ? t('matchesFound', { count: favoriteUsers.length })
                                                        : t("noResultsFound", {page: page})
                                                    }
                                                </span>
                                                {hasFavoriteInCurrentPage && (
                                                    <Button className="cursor-pointer text-xs sm:text-sm hover:text-destructive " variant="ghost" size="sm"
                                                        onClick={() => setFilterTextFavorites('')}>
                                                    {t("clearFilter")}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {favoritesArray.length > 0 && (
                                    <div className="flex justify-end gap-2 mt-0">
                                        <Button
                                            onClick={() => handleExportPeopleOrFavorites('csv', 'favorites')}
                                            variant="ghost"
                                            size="sm"
                                            disabled={favoriteUsers.length === 0}
                                            className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
                                        >
                                            <Download className="mr-2 h-4 w-4"/> {t("exportToCSV")}
                                        </Button>
                                        <Button
                                            onClick={() => handleExportPeopleOrFavorites('json', 'favorites')}
                                            variant="ghost"
                                            size="sm"
                                            disabled={favoriteUsers.length === 0}
                                            className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
                                        >
                                            <Download className="mr-2 h-4 w-4"/> {t("exportToJson")}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {!(filterTextFavorites && favoriteUsers.length === 0) && (
                                <Card className="relative border-0 bg-white dark:bg-gray-950 shadow-sm transition-all duration-300 hover:shadow-md">
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-100/10 dark:to-blue-900/10" />
                                    <CardHeader className="pb-2 px-4 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xl font-bold tracking-tight px-0">
                                                <span className="-mt-5 flex items-center gap-3 text-gray-900 dark:text-white">
                                                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 transition-all duration-300 mt-1 -ml-2">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className={isMobile ? "-ml-1 text-base" : "-ml-1"}>{t('favoritesPageTitle', { page: interpolatedPage() })}</span>
                                                </span>
                                            </CardTitle>
                                            {hasFavoriteInCurrentPage && (
                                                <Tooltip delayDuration={200}>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="ml-2 hover:scale-[0.98] active:scale-[0.95] border-none cursor-pointer h-8 px-2 hover:bg-destructive/10 hover:text-destructive text-destructive text-xs sm:text-sm sm:px-4 relative z-10 transition-all duration-300 ease-in-out"
                                                            onClick={handleClearCurrentPageFavorites}
                                                        >
                                                            <Eraser className="h-4 w-4 mr-1 text-destructive animate-pulse hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100" />
                                                            {!isMobile && t('clearCurrentPage')}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" sideOffset={8} className="rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-xs">
                                                        <p>{t('clearCurrentPageTooltip')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full mt-4" />
                                    </CardHeader>

                                    {favoritesArray.length === 0 || !hasFavoriteInCurrentPage ? (
                                        <CardContent className="flex items-center justify-center p-6 text-center border-t">
                                            <p className="text-lg font-bold">{t('noFavorites', {page: page})}</p>
                                        </CardContent>
                                    ) : (
                                        <>
                                            <CardContent className="relative z-10 p-0">
                                                <ul className="divide-y divide-border/30">
                                                    {paginatedFavorites.map((person) => (
                                                        <li
                                                            key={person.url}
                                                            onClick={() => handleRowClick(person)}
                                                            className="group relative overflow-hidden transition-all duration-300 ease-out hover:shadow-sm hover:-translate-y-0.5 cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-l-transparent hover:border-l-blue-500"
                                                            title={t('clickToViewDetails')}
                                                        >
                                                            <div className="flex items-center justify-between relative z-10">
                                                                <div className="flex-grow overflow-x-auto scrollbar-thin pr-4 pb-3" style={{ scrollBehavior: "smooth" }}>
                                                                    <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-4 min-w-max">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
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
                                                                                <Palette className="h-3 w-3 text-blue-600 dark:text-blue-400" />
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
                                                                                    <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
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
                                                                                    <Ruler className="h-3 w-3 text-blue-600 dark:text-blue-400" />
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
                                                                    className={`cursor-pointer h-7 w-7 p-0 opacity-70 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100 relative z-10 flex-shrink-0`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const id = person.url?.split('/').slice(-1)[0];
                                                                        if (id) {
                                                                            handleRemoveFavorite(id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <X className={`h-3.5 w-3.5 transition duration-300 ease-in-out ${isMobile ? "text-destructive animate-pulse" : "text-destructive"}`} />
                                                                    <span className="sr-only">{t('removeFromFavorites')}</span>
                                                                </Button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>

                                            <CardFooter className="pt-2 pb-2 px-4 flex justify-between items-center border-t relative z-20 bg-white dark:bg-gray-950">
                                                <div className="text-xs text-gray-600 dark:text-gray-300 font-bold">
                                                    {t("pageInfo", {
                                                        current: `${startIndexFavorites + 1}-${Math.min(startIndexFavorites + ITEMS_PER_PAGE_FAVORITES, favoriteUsers.length)}`,
                                                        total: favoriteUsers.length
                                                    })}
                                                </div>

                                                {favoriteUsers.length >= ITEMS_PER_PAGE_FAVORITES && favoriteUsers.length > 10 && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200"
                                                            disabled={currentPageFavorites === 1}
                                                            onClick={prevPageFavorites}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200"
                                                            disabled={currentPageFavorites === totalPagesFavorites}
                                                            onClick={nextPageFavorites}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardFooter>
                                        </>
                                    )}
                                </Card>
                            )}
                            {filterTextFavorites && favoriteUsers.length === 0 && (
                                <p className="text-center text-destructive text-sm mt-4">{t('noFavoritesMatchFilter')}</p>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            <CharacterDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                character={selectedCharacter}
            />
        </div>
    );
};
export default Users;
