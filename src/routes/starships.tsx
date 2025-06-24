import { useSwapiStarships } from "@/hooks/use-swapi-starships";
import { LogWatcher } from "@/components/layout/log-watcher";
import { useTranslation } from 'react-i18next';
import type {Starship} from "@/types";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Calendar, ChevronLeft, ChevronRight, Eraser, Palette, RotateCcw, Ruler, Trash2, Users, X} from "lucide-react";
import {useQueryClient} from "@tanstack/react-query";
import {Input} from "@/components/ui/input";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@radix-ui/react-tabs";
import { useStarshipsLogWatcher } from '@/hooks/use-starships-log-watcher';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {useFavoritesStarships} from "@/hooks/use-favorites.tsx";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import { StarshipDetailsModal } from "@/components/starships/starship-details-modal";
import { useSearch, useNavigate } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table';
import {columns, fuzzyFilter} from '@/components/starships/columns';
import {toast} from "sonner";
import i18n from "i18next";
import { Download } from 'lucide-react';
import { exportCsv, exportToJson} from '@/utils/export';

const ITEMS_PER_PAGE = 10;

export const Starships = () => {
    const { t } = useTranslation();
    const { page: pageStarships, limit } = useSearch({ from: '/starships'});
    const page = useMemo(() => Number(pageStarships) || 1, [pageStarships]);
    const { starships, isLoading, isRefetching, totalStarships, totalPages } = useSwapiStarships(page, limit);
    const navigate = useNavigate({ from: '/starships'});
    const [isMobile, setIsMobile] = useState(false);
    const {favorites, favoritesArray, toggleFavoriteStarships, clearAll, clearCurrentPageFavorites: clearStarshipFavoritesActualPage} = useFavoritesStarships();
    const [filterTextFavorites, setFilterTextFavorites] = useState("");
    const [goToPageInput, setGoToPageInput] = useState('');
    const [activeTab, setActiveTab] = useState("all");
    const [currentPageFavorites, setCurrentPageFavorites] = useState(1);
    const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const { resetLogWatcher } = useStarshipsLogWatcher();
    const [globalFilterStarships, setGlobalFilterStarships] = useState('');
    const seenStarshipsRef = useRef<Map<string, Starship>>(new Map());
    const fetchedPagesRef = useRef(new Set());
    const previousPagesRef = useRef(page);
    const [seenStarshipsCount, setSeenStarshipsCount] = useState(0);


    const getOrdinalStarshipsFavoritesPagesSuffix = useCallback((number: number): string => {
        const s = ["th", "st", "nd", "rd"];
        const v = number % 100;
        return (s[(v - 20) % 10] || s[v] || s[0]);
    }, []);

    const interpolatedPages = useCallback(() => {
        return i18n.language !== "en" ? page : `${page}${getOrdinalStarshipsFavoritesPagesSuffix(page)}`;
    }, [getOrdinalStarshipsFavoritesPagesSuffix, page]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const starshipsIdArrCurrentPage = useCallback(() =>  {
        return starships?.map(starship => {
            if(!starship.url) return null;
            const id = starship.url.split('/').pop();
            return id ?? null;
        }).filter(Boolean) as string[] || [];
    }, [starships]);

    useEffect(() => {
        const pageKey = `${page}-${limit}`;
        const wasPageFetched = fetchedPagesRef.current.has(pageKey);
        const pageChanged = previousPagesRef.current !== page;
        if(!wasPageFetched || pageChanged) {
            resetLogWatcher();
            seenStarshipsRef.current = new Map();
            fetchedPagesRef.current = new Set();
            setSeenStarshipsCount(0);
        }

        if(starships && !isLoading) {
            fetchedPagesRef.current.add(pageKey);
            starships.forEach(starship => {
                const id = starship.url?.split("/").slice(-1)[0];
                if (id && !seenStarshipsRef.current.has(id)) {
                    seenStarshipsRef.current.set(id, starship);
                }
            })
            setSeenStarshipsCount(seenStarshipsRef.current.size);
        }
        previousPagesRef.current = page;
    }, [page, limit, starships, isLoading, resetLogWatcher]);

    const hasFavoritesStarshipsInCurrentPage = useMemo(() => {
        const currentPageStarshipsIds = starshipsIdArrCurrentPage();
        return currentPageStarshipsIds.some(id => favoritesArray.includes(id));
    }, [starshipsIdArrCurrentPage, favoritesArray]);

    const handleRefetch = useCallback(async () => {
        resetLogWatcher();
        setGoToPageInput('');
        if(hasFavoritesStarshipsInCurrentPage) {
            clearStarshipFavoritesActualPage(starshipsIdArrCurrentPage());
            setFilterTextFavorites('');
            setCurrentPageFavorites(1);
        }
        seenStarshipsRef.current = new Map();
        fetchedPagesRef.current = new Set();
        setSeenStarshipsCount(0);
        try {
            await queryClient.refetchQueries({
                queryKey: ["swapi-starships", page, limit],
                exact: true,
                type: 'active'
            });
        } catch (error) {
            console.error("Error during refetching starships data:", error);
        }
    }, [queryClient, starshipsIdArrCurrentPage, hasFavoritesStarshipsInCurrentPage, resetLogWatcher, page, limit, clearStarshipFavoritesActualPage]);


    const cleanAndParse = useCallback((val: string | number | undefined): string => {
        if (val === null || val === undefined || val === "n/a" || val === "unknown" || val === "none") {
            return 'unknown';
        }
        const cleanedVal = String(val).replace(/,/g, '');
        const num = parseFloat(cleanedVal);
        return isNaN(num) ? 'unknown' : String(num);
    }, []);

    const formattedStarships: Starship[] = useMemo(() => {
        const processedData: Starship[] = [];
        if (starships !== undefined && !isLoading) {
            starships.forEach((starship: Starship) => {
                processedData.push({
                    ...starship,
                    passengers: cleanAndParse(starship.passengers),
                    cargo_capacity: cleanAndParse(starship.cargo_capacity),
                    max_atmosphering_speed: cleanAndParse(starship.max_atmosphering_speed),
                    pilots: starship.pilots,
                });
            });
        }
        return processedData;
    }, [cleanAndParse, starships, isLoading]);

    const favoritesStarships = useMemo(() => {
        return formattedStarships?.filter((starship) => {
            const id = starship?.url?.split('/').slice(-1)[0];
            if (!id || !favorites[id]) return false;
            if (!filterTextFavorites) return true;
            const search = filterTextFavorites.toLowerCase();
            return (
                starship.name.toLowerCase().includes(search) ||
                starship.model.toLowerCase().includes(search) ||
                starship.manufacturer.toLowerCase().includes(search) ||
                starship.max_atmosphering_speed.toLowerCase().includes(search) ||
                (starship.cargo_capacity && String(starship.cargo_capacity).toLowerCase().includes(search)) ||
                (starship.passengers && String(starship.passengers).toLowerCase().includes(search))
            );
        }) || [];
    }, [formattedStarships, favorites, filterTextFavorites]);

    const handleFilterChangeFavorites = useCallback((input: string) => {
        const filtered = input.replace(/[^\w\s-/]/gi, '');
        setFilterTextFavorites(filtered);
        setCurrentPageFavorites(1);
    }, []);

    const handleRowClick = useCallback((starship: Starship) => {
        setSelectedStarship(starship);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedStarship(null);
    }, []);

    const totalPagesFavorites = useMemo(() => Math.ceil(favoritesStarships.length / ITEMS_PER_PAGE), [favoritesStarships.length]);
    const startIndexFavorites = (currentPageFavorites - 1) * ITEMS_PER_PAGE;
    const paginatedFavorites = useMemo(() => favoritesStarships.slice(startIndexFavorites, startIndexFavorites + ITEMS_PER_PAGE), [favoritesStarships, startIndexFavorites]);

    const nextPageFavorites = useCallback(() => {
        setCurrentPageFavorites(prev => Math.min(prev + 1, totalPagesFavorites));
    }, [totalPagesFavorites]);

    const prevPageFavorites = useCallback(() => {
        setCurrentPageFavorites(prev => Math.max(prev - 1, 1));
    }, []);

    useEffect(() => {
        const newTotalPages = Math.ceil(favoritesStarships.length / ITEMS_PER_PAGE);
        if(favoritesStarships.length === 0) {
            setCurrentPageFavorites(1);
            return;
        }
        const startIndex = (currentPageFavorites - 1) * ITEMS_PER_PAGE;
        const elementsForPage = favoritesStarships.slice(startIndex, startIndex + ITEMS_PER_PAGE).length;

        if(elementsForPage === 0 && currentPageFavorites > 1) {
            setCurrentPageFavorites(currentPageFavorites - 1);
        } else if(currentPageFavorites > newTotalPages && newTotalPages > 0) {
            setCurrentPageFavorites(newTotalPages);
        }
    }, [favoritesStarships.length, currentPageFavorites, favoritesStarships]);

    const handleClearAllFavorites = useCallback(() => {
        clearAll();
        setCurrentPageFavorites(1);
        setFilterTextFavorites('');
    }, [clearAll]);

    const handleClearCurrentPageFavorites = useCallback(() => {
        const idsInCurrentPage = paginatedFavorites.map(starship => starship.url?.split('/').slice(-1)[0]).filter(Boolean) as string[];
        if(idsInCurrentPage.length > 0) {
            clearStarshipFavoritesActualPage(idsInCurrentPage);
            setFilterTextFavorites('')
        }
    }, [clearStarshipFavoritesActualPage, paginatedFavorites]);

    const goToNextPageStarships = useCallback(async function () {
        await navigate({
            search: prev => ({
                ...prev,
                page: prev.page + 1
            })
        });
    }, [navigate]);

    const goToPreviousPageStarships = useCallback(async function () {
        await navigate({
            search: prev => ({
                ...prev,
                page: Math.max(1, prev.page - 1)
            })
        });
    }, [navigate]);

    const handlePageSizeChangeStarships = useCallback(async function (newSize: number) {
        await navigate({
            search: prev => ({
                ...prev,
                limit: newSize,
                page: 1
            })
        });
    }, [navigate]);

    const goToSpecificPageStarships = useCallback(async () => {
        const numberOfPage = parseInt(goToPageInput);
        if(numberOfPage > 0 && totalPages !== undefined && numberOfPage <= totalPages && numberOfPage !== page) {
            await navigate({ search: (oldSearch) => ({ ...oldSearch, page: numberOfPage }) });
            setGoToPageInput('');
        }  else if (numberOfPage === page) {
            console.warn(`Already on page ${numberOfPage}. Total pages: ${totalPages}`);
            toast.error(t('alreadyOnPage', { page: numberOfPage, total: totalPages }));
            setGoToPageInput('');
        } else {
            console.warn(`Invalid page number: ${numberOfPage}. Total pages: ${totalPages}`);
            toast.error(t('invalidPageNumber', { page: isNaN(numberOfPage) ? '' : numberOfPage, total: totalPages }));
            setGoToPageInput('');
        }
    }, [goToPageInput, navigate, page, t, totalPages]);

    const canNextPageStarships = useMemo(() => {
        const missing = totalStarships == null || limit == null;
        if (missing) return false;
        return page * limit <= totalStarships;
    }, [page, limit, totalStarships]);

    const canPreviousPageStarships = useMemo(() => page > 1, [page]);

    const handleExportStarshipsOrFavorites = useCallback((format: 'csv' | 'json', starshipsOrFavorites: 'starships' | 'favorites') => {
        const dataToExport = starshipsOrFavorites === 'starships' ? formattedStarships : paginatedFavorites;
        if(dataToExport.length === 0){
            toast.info(t('noDataToExport'));
            return;
        }
        const filename = starshipsOrFavorites === 'starships' ? `${t('starships')}_page_${page}` : `${t('favorites')}_page_${currentPageFavorites}`;
        if(format === 'csv') {
            exportCsv(dataToExport, filename);
            toast.success(t('exportSuccess', { format: 'CSV', filename: filename }));
        }else {
            exportToJson(dataToExport, filename);
            toast.success(t('exportSuccess', { format: 'JSON', filename: filename }));
        }
    }, [formattedStarships, paginatedFavorites, t, page, currentPageFavorites]);

    return (
        <div className="flex flex-col p-8 pt-6 space-y-6 w-full h-full">
            <div className="flex justify-center items-center">
                <h2 className="text-3xl font-bold tracking-tight text-center">
                    {t('starshipsPageTitle')}
                </h2>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 flex flex-wrap sm:flex-nowrap">
                    <TabsTrigger
                        value="all"
                        className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current px-4 pb-3 pt-2 -mb-px text-sm sm:text-base whitespace-nowrap sm:flex-none flex-1"
                    >
                        {t("allStarships")}
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
                        <LogWatcher className="h-[300px]" useWatcherHook={useStarshipsLogWatcher}/>
                    ) : (
                        <>
                            <div className="flex justify-between items-center w-full mb-4">
                                {totalPages !== undefined && totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                            <div className="flex items-center jutify-center">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={totalPages}
                                                    value={goToPageInput}
                                                    onChange={(e) => setGoToPageInput(e.target.value)}
                                                    placeholder={t("goToPagePlaceholder", { total: totalPages })}
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
                                                        if(e.key === 'Enter') {
                                                            await goToSpecificPageStarships();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    onClick={goToSpecificPageStarships}
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
                                        <TooltipContent side="top" sideOffset={0} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                            <p>{t('goToPageTooltip', { total: totalPages })}</p>
                                        </TooltipContent>
                                        </Tooltip>
                                    </div>
                                )}
                                <div className="flex flex-wrap justify-end gap-2 mt-3 sm:flex-nowrap">
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={() => handleExportStarshipsOrFavorites('csv', 'starships')}
                                                variant="ghost"
                                                size="sm"
                                                disabled={formattedStarships.length === 0}
                                                className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                                            >
                                                <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {t("exportToCSV")}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={8} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                            <p>{t("tooltipExportToCsv", {page: page})}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => handleExportStarshipsOrFavorites('json', 'starships')}
                                            variant="ghost"
                                            size="sm"
                                            disabled={formattedStarships.length === 0}
                                            className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                                        >
                                            <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {t("exportToJson")}
                                        </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={8} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                            <p>{t("tooltipExportToJson", {page: page})}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                            <DataTable
                                data={formattedStarships || []}
                                columns={columns}
                                globalFilterFn={fuzzyFilter}
                                filterPlaceholder={t("filterStarshipsPlaceholder")}
                                onRowClick={handleRowClick}
                                clickDetailsTooltip={t("clickToViewStarshipDetails")}
                                serverPagination={{
                                    pageIndex: page -1,
                                    pageSize: limit,
                                    pageCount: totalPages !== undefined ? totalPages : -1,
                                    canNextPage: canNextPageStarships,
                                    canPreviousPage: canPreviousPageStarships,
                                    nextPage: goToNextPageStarships,
                                    previousPage: goToPreviousPageStarships,
                                    setPageSize: handlePageSizeChangeStarships,
                                    totalRows: totalStarships,
                                    currentPageForDisplay: page,
                                }}
                                globalFilterValue={globalFilterStarships}
                                onGlobalFilterChange={setGlobalFilterStarships}
                            />
                            {(formattedStarships.length > 0 || globalFilterStarships) && (
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
                                            {t("totalRecords", { count: seenStarshipsCount, total: totalStarships })}
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
                            <LogWatcher className="h-[300px]" useWatcherHook={useStarshipsLogWatcher}/>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center w-full mb-4">
                                {favoritesArray.length > 0 && hasFavoritesStarshipsInCurrentPage && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 sm:gap-4">
                                            <Input
                                                placeholder={t("filterFavoritesPlaceholder")}
                                                className="max-w-sm"
                                                onChange={(e) => {
                                                    handleFilterChangeFavorites(e.target.value);
                                                }}
                                                value={filterTextFavorites}
                                            />
                                            {favoritesArray.length > 0 && hasFavoritesStarshipsInCurrentPage && !filterTextFavorites && (
                                                <Tooltip delayDuration={200}>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="border-none cursor-pointer h-8 -mr-3 px-2 hover:bg-destructive/10 hover:text-destructive text-xs sm:text-sm sm:px-4 relative z-10 transition-all duration-300 ease-in-out"
                                                            onClick={handleClearAllFavorites}
                                                        >
                                                            {!isMobile ? (<div className="flex items-center gap-1 col-span-2 text-destructive animate-pulse hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100">{t('clearAll')}<Trash2 className="h-4 w-4 hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100" /></div>) : <Trash2 className="h-4 w-4 text-destructive animate-pulse hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100" />}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" sideOffset={0} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                                        <p>{t("clearAllFavoritesTooltip")}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        {filterTextFavorites && (
                                            <div className="mb-2 text-xs sm:text-sm flex items-center justify-between px-1 text-muted-foreground animate-fade-in truncate">
                                                <span className={favoritesStarships.length === 0 ? 'text-destructive' : ''}>
                                                    {favoritesStarships.length > 0
                                                        ? t('matchesFound', {count: favoritesStarships.length})
                                                        : t("noResultsFound", {page: page})
                                                    }
                                                </span>
                                                {hasFavoritesStarshipsInCurrentPage && (
                                                    <Button className="cursor-pointer text-xs sm:text-sm hover:text-destructive" variant="ghost" size="sm"
                                                            onClick={() => setFilterTextFavorites('')}>
                                                        {t("clearFilter")}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {favoritesArray.length > 0 && (
                                    <div className="flex flex-wrap justify-end gap-2 mt-0 sm:flex-nowrap">
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                            <Button
                                                onClick={() => handleExportStarshipsOrFavorites('csv', 'favorites')}
                                                variant="ghost"
                                                size="sm"
                                                disabled={favoritesStarships.length === 0}
                                                className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
                                            >
                                                <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {t("exportToCSV")}
                                            </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" sideOffset={8} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                                <p>{t("tooltipExportToCsvFavorites", {page: page})}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={() => handleExportStarshipsOrFavorites('json', 'favorites')}
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={favoritesStarships.length === 0}
                                                    className="border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                                                >
                                                    <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {t("exportToJson")}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" sideOffset={8} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                                <p>{t("tooltipExportToJsonFavorites", {page: page})}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                            {!(filterTextFavorites && favoritesStarships.length === 0) && (
                                <Card className="relative border-0 bg-white dark:bg-gray-950 shadow-sm transition-all duration-300 hover:shadow-md">
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/10 dark:to-gray-900/10" />
                                    <CardHeader className="pb-2 px-4 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xl font-bold tracking-tight px-0">
                                                <span className="-mt-5 flex items-center gap-3 text-gray-900 dark:text-white">
                                                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/30 transition-all duration-300 mt-1 -ml-2">
                                                        <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                                                    </div>
                                                    <span className={isMobile ? "-ml-1 text-base" : "-ml-1"}>{t('favoritesPageTitle', { page: interpolatedPages() })}</span>
                                                </span>
                                            </CardTitle>
                                            {hasFavoritesStarshipsInCurrentPage && (
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
                                                    <TooltipContent side="top" sideOffset={-5} className="rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-xs">
                                                        <p>{t('clearCurrentPageTooltip')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <div className="h-1 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 rounded-full mt-4" />
                                    </CardHeader>

                                    {favoritesArray.length === 0 || !hasFavoritesStarshipsInCurrentPage ? (
                                        <CardContent className="flex items-center justify-center p-6 text-center border-t">
                                            <p className="text-lg font-bold">{t('noFavorites', {page: page})}</p>
                                        </CardContent>
                                    ) : (
                                        <>
                                            <CardContent className="relative z-10 p-0">
                                                <ul className="divide-y divide-border/30">
                                                    {paginatedFavorites.map((starship) => (
                                                        <li
                                                            key={starship.url}
                                                            onClick={() => handleRowClick(starship)}
                                                            className="group relative overflow-hidden transition-all duration-300 ease-out hover:shadow-sm hover:-translate-y-0.5 cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-l-transparent hover:border-l-gray-500"
                                                            title={t('clickToViewDetails')}
                                                        >
                                                            <div className="flex items-center justify-between relative z-10">
                                                                <div className="flex-grow overflow-x-auto scrollbar-thin pr-4 pb-3" style={{ scrollBehavior: "smooth" }}>
                                                                    <div className="grid grid-flow-col gap-x-80 min-w-max">
                                                                        <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                            <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                <Palette className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                            </div>
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-[500] border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden" // Aggiunto overflow-hidden
                                                                            >
                                                                                <span className="font-semibold truncate">{starship.name}</span>
                                                                            </Badge>
                                                                        </div>

                                                                        <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                            <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                <Ruler className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                            </div>
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden" // Aggiunto overflow-hidden
                                                                            >
                                                                                <span className="font-semibold truncate">{starship.model}</span>
                                                                            </Badge>
                                                                        </div>

                                                                        <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                            <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                <Calendar className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                            </div>
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden" // Aggiunto overflow-hidden
                                                                            >
                                                                                <span className="font-semibold truncate">{starship.manufacturer}</span>
                                                                            </Badge>
                                                                        </div>

                                                                        <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                            <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                <Ruler className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                            </div>
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden" // Aggiunto overflow-hidden
                                                                            >
                                                                                <span className="font-semibold truncate">{starship.max_atmosphering_speed}</span>
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                            <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                <Users className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                            </div>
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden" // Aggiunto overflow-hidden
                                                                            >
                                                                                <span className="font-semibold truncate">{starship.passengers}</span>
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="cursor-pointer h-7 w-7 p-0 opacity-70 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive hover:scale-[0.98] active:scale-[0.95] transition-transform transform duration-100 relative z-10 flex-shrink-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const id = starship.url?.split('/').slice(-1)[0];
                                                                        if (id) toggleFavoriteStarships(id);
                                                                    }}
                                                                >
                                                                    <X className={`h-3.5 w-3.5 transition duration-300 ease-in-out ${isMobile ? "text-destructive animate-pulse" : "text-destructive"}`}/>
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
                                                        current: `${startIndexFavorites + 1}-${Math.min(startIndexFavorites + ITEMS_PER_PAGE, favoritesStarships.length)}`,
                                                        total: favoritesStarships.length
                                                    })}
                                                </div>
                                                {favoritesStarships.length > ITEMS_PER_PAGE && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200"
                                                            disabled={currentPageFavorites === 1}
                                                            onClick={prevPageFavorites}
                                                        >
                                                            <ChevronLeft className="h-4 w-4"/>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200"
                                                            disabled={currentPageFavorites === totalPagesFavorites}
                                                            onClick={nextPageFavorites}
                                                        >
                                                            <ChevronRight className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardFooter>
                                        </>
                                    )}
                                </Card>
                            )}
                            {filterTextFavorites && favoritesStarships.length === 0 && (
                                <p className="text-center text-destructive text-sm mt-4">{t('noFavoritesMatchFilter')}</p>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            <StarshipDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                starship={selectedStarship}
            />
        </div>
    );
};