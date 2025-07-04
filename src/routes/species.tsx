import {
    CheckSquare,
    ChevronLeft,
    ChevronRight, Clock,
    Eraser, ListFilter,
    Palette,
    RotateCcw,
    Ruler,
    Trash2,
    X
} from "lucide-react";
import {useQueryClient} from "@tanstack/react-query";
import {Input} from "@/components/ui/input";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@radix-ui/react-tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {useFavoritesSpecies} from "@/hooks/use-favorites";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge.tsx";
import { SpeciesDetailsModal } from "@/components/species/species-details-modal";
import { useSearch, useNavigate } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table';
import {columns, fuzzyFilter} from '@/components/species/columns';
import {toast} from "sonner";
import i18n from "i18next";
import { Download } from 'lucide-react';
import {useTranslation} from "react-i18next";
import {useSwapiSpecies} from "@/hooks/use-swapi-species";
import type {Species as SpeciesInterface} from "@/types";
import {useSpeciesLogWatcher} from "@/hooks/use-species-log-watcher";
import {LogWatcher} from "@/components/layout/log-watcher.tsx";
import {Button} from "@/components/ui/button.tsx";
import {exportCsv, exportToJson} from "@/utils/export.ts";
import { PageTransitionWrapper } from "@/components/ui/page-transition-wrapper";

const ITEMS_PER_PAGE = 10;

export const Species = () => {
    const { t } = useTranslation();
    const { page: pageSpecies, limit } = useSearch({ from: '/species'});
    const page = useMemo(() => Number(pageSpecies) || 1, [pageSpecies]);
    const { species, isLoading, isRefetching, totalSpecies, totalPages } = useSwapiSpecies(page, limit);
    const navigate = useNavigate({ from: '/species'});
    const [isMobile, setIsMobile] = useState(false);
    const {favorites, favoritesArray, toggleFavoriteSpecies, clearAll, clearCurrentPageFavorites: clearSpeciesFavoritesActualPage} = useFavoritesSpecies();
    const [filterTextFavorites, setFilterTextFavorites] = useState("");
    const [goToPageInput, setGoToPageInput] = useState('');
    const [activeTab, setActiveTab] = useState("all");
    const [currentPageFavorites, setCurrentPageFavorites] = useState(1);
    const [selectedSpecies, setSelectedSpecies] = useState<SpeciesInterface | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const { resetLogWatcher } = useSpeciesLogWatcher();
    const [globalFilterSpecies, setGlobalFilterSpecies] = useState('');
    const seenSpeciesRef = useRef<Map<string, SpeciesInterface>>(new Map());
    const fetchedSpeciesPagesRef = useRef(new Set());
    const previousSpeciesPagesRef = useRef<number>(page);
    const [seenSpeciesCount, setSeenSpeciesCount] = useState<number>(0);

    const getOrdinalSpeciesFavoritesPagesSuffix = useCallback((number: number): string => {
        const suffixes = ["th", "st", "nd", "rd"];
        const mod100 = number % 100;
        const mod10 = (mod100 - 20) % 10;
        return suffixes[mod10] || suffixes[mod100] || suffixes[0];
    }, []);

    const interpolatedPages = useCallback(() => {
        return i18n.language !== "en" ? page : `${page}${getOrdinalSpeciesFavoritesPagesSuffix(page)}`;
    }, [getOrdinalSpeciesFavoritesPagesSuffix, page]);

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
    
    const speciesIdArrCurrentPage = useCallback(() => {
        return species?.map((s) => {
            if(!s.url) return null;
            const id = s.url.split('/').pop();
            return id ?? null;
        }).filter(Boolean) as string[] || [];
    }, [species]);
    
    useEffect(() => {
        const pageKey = `${page}-${limit}`;
        const wasPageFetched = fetchedSpeciesPagesRef.current.has(pageKey);
        const pageChanged = previousSpeciesPagesRef.current !== page;
        if(!wasPageFetched || pageChanged) {
            resetLogWatcher();
            seenSpeciesRef.current = new Map();
            fetchedSpeciesPagesRef.current = new Set();
            setSeenSpeciesCount(0);
        }

        if(species && !isLoading) {
            fetchedSpeciesPagesRef.current.add(pageKey);
            species.forEach(s => {
                const id = s.url?.split("/").slice(-1)[0];
                if (id && !seenSpeciesRef.current.has(id)) {
                    seenSpeciesRef.current.set(id, s);
                }
            })
            setSeenSpeciesCount(seenSpeciesRef.current.size);
        }
        previousSpeciesPagesRef.current = page;
    }, [page, limit, species, isLoading, resetLogWatcher])

    const hasFavoritesSpeciesInCurrentPage = useMemo(() => {
        const currentPageSpeciesIds = speciesIdArrCurrentPage();
        return currentPageSpeciesIds.some(id => favoritesArray.includes(id));
    }, [speciesIdArrCurrentPage, favoritesArray]);

    const handleRefetch = useCallback(async () => {
        resetLogWatcher();
        setGoToPageInput('');
        if(hasFavoritesSpeciesInCurrentPage) {
            clearSpeciesFavoritesActualPage(speciesIdArrCurrentPage());
            setFilterTextFavorites('');
            setCurrentPageFavorites(1);
        }
        seenSpeciesRef.current = new Map();
        fetchedSpeciesPagesRef.current = new Set();
        setSeenSpeciesCount(0);
        try {
            await queryClient.refetchQueries({
                queryKey: ["swapi-species", page, limit],
                exact: true,
                type: 'active'
            });
        } catch (error) {
            console.error("Error during refetching starships data:", error);
        }
    }, [queryClient, speciesIdArrCurrentPage, hasFavoritesSpeciesInCurrentPage, resetLogWatcher, page, limit, clearSpeciesFavoritesActualPage]);


    const favoritesSpecies = useMemo(() => {
        return species?.filter((s) => {
            const id = s?.url?.split('/').slice(-1)[0];
            if (!id || !favorites[id]) return false;
            if (!filterTextFavorites) return true;
            const search = filterTextFavorites.toLowerCase();
            return (
                s.name.toLowerCase().includes(search) ||
                s.classification.toLowerCase().includes(search) ||
                s.designation.toLowerCase().includes(search) ||
                s.average_height.toLowerCase().includes(search) ||
                s.average_lifespan.toLowerCase().includes(search)
            );
        }) || [];
    }, [species, favorites, filterTextFavorites]);

    const handleFilterChangeFavorites = useCallback((input: string) => {
        const filtered = input.replace(/[^\w\s-/]/gi, '');
        setFilterTextFavorites(filtered);
        setCurrentPageFavorites(1);
    }, []);

    const handleRowClick = useCallback((s: SpeciesInterface) => {
        setSelectedSpecies(s);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedSpecies(null);
    }, []);

    const totalPagesFavorites = useMemo(() => Math.ceil(favoritesSpecies.length / ITEMS_PER_PAGE), [favoritesSpecies.length]);
    const startIndexFavorites = (currentPageFavorites - 1) * ITEMS_PER_PAGE;
    const paginatedFavorites = useMemo(() => favoritesSpecies.slice(startIndexFavorites, startIndexFavorites + ITEMS_PER_PAGE), [favoritesSpecies, startIndexFavorites]);

    const nextPageFavorites = useCallback(() => {
        setCurrentPageFavorites(prev => Math.min(prev + 1, totalPagesFavorites));
    }, [totalPagesFavorites]);

    const prevPageFavorites = useCallback(() => {
        setCurrentPageFavorites(prev => Math.max(prev - 1, 1));
    }, []);

    useEffect(() => {
        const newTotalPages = Math.ceil(favoritesSpecies.length / ITEMS_PER_PAGE);
        if(favoritesSpecies.length === 0) {
            setCurrentPageFavorites(1);
            return;
        }
        const startIndex = (currentPageFavorites - 1) * ITEMS_PER_PAGE;
        const elementsForPage = favoritesSpecies.slice(startIndex, startIndex + ITEMS_PER_PAGE).length;

        if(elementsForPage === 0 && currentPageFavorites > 1) {
            setCurrentPageFavorites(currentPageFavorites - 1);
        } else if(currentPageFavorites > newTotalPages && newTotalPages > 0) {
            setCurrentPageFavorites(newTotalPages);
        }
    }, [favoritesSpecies.length, currentPageFavorites, favoritesSpecies]);

    const handleClearAllFavorites = useCallback(() => {
        clearAll();
        setCurrentPageFavorites(1);
        setFilterTextFavorites('');
    }, [clearAll]);

    const handleClearCurrentPageFavorites = useCallback(() => {
        const idsInCurrentPage = paginatedFavorites.map(s => s.url?.split('/').slice(-1)[0]).filter(Boolean) as string[];
        if(idsInCurrentPage.length > 0) {
            clearSpeciesFavoritesActualPage(idsInCurrentPage);
            setFilterTextFavorites('')
        }
    }, [clearSpeciesFavoritesActualPage, paginatedFavorites]);

    const goToNextPageSpecies = useCallback(async () => {
        await navigate({
            search: (prev) => {
                return {
                    ...prev,
                    page: prev.page + 1
                };
            }
        });
    }, [navigate]);

    const goToPreviousPageSpecies = useCallback(async () => {
        await navigate({
            search: (prev) => {
                return {
                    ...prev,
                    page: Math.max(1, prev.page - 1)
                };
            }
        });
    }, [navigate]);

    const handlePageSizeChangeSpecies = useCallback(async (newSize: number) => {
        await navigate({
            search: (prev) => {
                return {
                    ...prev,
                    limit: newSize,
                    page: 1
                };
            }
        });
    }, [navigate]);

    const goToSpecificPageSpecies = useCallback(async function (){
        const numberOfInputPage = parseInt(goToPageInput);
        if(numberOfInputPage > 0 && totalPages !== undefined && numberOfInputPage <= totalPages && numberOfInputPage !== page) {
            await navigate({ search: (oldSearch) => ({ ...oldSearch, page: numberOfInputPage }) });
            setGoToPageInput('');
        }  else if (numberOfInputPage === page) {
            console.warn(`Already on page ${numberOfInputPage}. Total pages: ${totalPages}`);
            toast.error(t('alreadyOnPage', { page: numberOfInputPage, total: totalPages }));
            setGoToPageInput('');
        } else {
            console.warn(`Invalid page number: ${numberOfInputPage}. Total pages: ${totalPages}`);
            toast.error(t('invalidPageNumber', { page: isNaN(numberOfInputPage) ? '' : numberOfInputPage, total: totalPages }));
            setGoToPageInput('');
        }
    }, [goToPageInput, navigate, page, t, totalPages]);

    const canNextPageSpecies = useMemo(() => {
        const missing = totalSpecies == null || limit == null;
        if (missing) return false;
        return page * limit <= totalSpecies;
    }, [page, limit, totalSpecies]);

    const canPreviousPageSpecies = useMemo(() => page > 1, [page]);

    const handleExportSpeciesOrFavorites = useCallback((format: 'csv' | 'json', speciesOrFavorites: 'species' | 'favorites') => {
        const dataToExport = speciesOrFavorites === 'species' ? species : paginatedFavorites;
        if(dataToExport.length === 0){
            toast.info(t('noDataToExport'));
            return;
        }
        const filename = speciesOrFavorites === 'species' ? `${t('species')}_page_${page}` : `${t('favorites')}_page_${currentPageFavorites}`;
        if(format === 'csv') {
            exportCsv(dataToExport, filename);
            toast.success(t('exportSuccess', { format: 'CSV', filename: filename }));
        }else {
            exportToJson(dataToExport, filename);
            toast.success(t('exportSuccess', { format: 'JSON', filename: filename }));
        }
    }, [species, paginatedFavorites, t, page, currentPageFavorites]);

    return (
        <PageTransitionWrapper>
            <div className="flex flex-col p-8 pt-6 space-y-6">
                <div className="flex justify-center items-center">
                    <h2 className="text-3xl font-bold tracking-tight text-center">{t('speciesPageTitle')}</h2>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 flex flex-wrap sm:flex-nowrap">
                        <TabsTrigger
                            value="all"
                            className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current px-4 pb-3 pt-2 -mb-px text-sm sm:text-base whitespace-nowrap sm:flex-none flex-1"
                        >
                            {t("allSpecies")}
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
                                <LogWatcher className="h-[300px]" useWatcherHook={useSpeciesLogWatcher} />
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full mb-4 gap-4 sm:gap-0">
                                    {totalPages !== undefined && totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-4 sm:mt-0">
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
                                                                    await goToSpecificPageSpecies();
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            onClick={goToSpecificPageSpecies}
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
                                                <TooltipContent side="top" sideOffset={0} className="whitespace-nowrap max-w-md rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
                                                    <p>{t('goToPageTooltip', { total: totalPages })}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center md:flex-row sm:justify-end gap-2 mt-4 sm:mt-0">
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={() => handleExportSpeciesOrFavorites('csv', 'species')}
                                                    variant="ghost"
                                                    disabled={species.length === 0}
                                                    className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                           h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                           sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
                                                >
                                                    <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {isMobile ? "CSV" : t("exportToCSV")}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" sideOffset={8} className="whitespace-nowrap max-w-md rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
                                                <p>{t('tooltipExportToCsv', { page: page })}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={() => handleExportSpeciesOrFavorites('json', 'species')}
                                                    variant="ghost"
                                                    disabled={species.length === 0}
                                                    className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                           h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                           sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
                                                >
                                                    <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {isMobile ? "JSON" : t("exportToJson")}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side={isMobile ? "bottom" : "top"} sideOffset={8} className="whitespace-nowrap max-w-md rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
                                                <p>{t('tooltipExportToJson', { page: page })}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                                <DataTable
                                    data={species || []}
                                    columns={columns}
                                    globalFilterFn={fuzzyFilter}
                                    filterPlaceholder={t("filterSpecies")}
                                    onRowClick={handleRowClick}
                                    clickDetailsTooltip={t('clickToViewDetails')}
                                    serverPagination={{
                                        pageIndex: page - 1,
                                        pageSize: limit,
                                        pageCount: totalPages !== undefined ? totalPages : -1,
                                        canNextPage: canNextPageSpecies,
                                        canPreviousPage: canPreviousPageSpecies,
                                        nextPage: goToNextPageSpecies,
                                        previousPage: goToPreviousPageSpecies,
                                        setPageSize: handlePageSizeChangeSpecies,
                                        totalRows: totalSpecies,
                                        currentPageForDisplay: page,
                                    }}
                                    globalFilterValue={globalFilterSpecies}
                                    onGlobalFilterChange={setGlobalFilterSpecies}
                                />
                                {(species.length > 0 || globalFilterSpecies) && (
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
                                                {t("totalRecords", { count: seenSpeciesCount , total: totalSpecies })}
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
                                <LogWatcher className="h-[300px]" useWatcherHook={useSpeciesLogWatcher}/>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full mb-4 gap-4 sm:gap-0">
                                    {favoritesArray.length > 0 && hasFavoritesSpeciesInCurrentPage && (
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
                                                {filterTextFavorites && hasFavoritesSpeciesInCurrentPage && (
                                                    <Button className="cursor-pointer text-xs sm:text-sm hover:text-destructive" variant="ghost" size="sm"
                                                            onClick={() => setFilterTextFavorites('')}>
                                                        {t("clearFilter")}
                                                    </Button>
                                                )}
                                                {favoritesArray.length > 0 && hasFavoritesSpeciesInCurrentPage && !filterTextFavorites && (
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
                                                    <span className={favoritesSpecies.length === 0 ? 'text-destructive' : ''}>
                                                        {favoritesSpecies.length > 0
                                                            ? t('matchesFound', {count: favoritesSpecies.length})
                                                            : t("noResultsFound", {page: page})
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {favoritesArray.length > 0 && (
                                        <div className="flex flex-col items-center md:flex-row sm:justify-end gap-2 mt-4 sm:mt-0">
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleExportSpeciesOrFavorites('csv', 'favorites')}
                                                        variant="ghost"
                                                        disabled={favoritesSpecies.length === 0}
                                                        className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                           h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                           sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
                                                    >
                                                        <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {isMobile ? "CSV" : t("exportToCSV")}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" sideOffset={8} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                                    <p>{t("tooltipExportToCsvFavorites", {page: page})}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleExportSpeciesOrFavorites('json', 'favorites')}
                                                        variant="ghost"
                                                        disabled={favoritesSpecies.length === 0}
                                                        className="mt-1 border border-gray-500 hover:scale-[0.95] active:scale-[0.95] cursor-pointer font-semibold
                                                           h-7 px-1 py-0.5 text-[0.6rem] w-full sm:w-auto
                                                           sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
                                                    >
                                                        <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"/> {isMobile ? "JSON" : t("exportToJson")}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side={isMobile ? "bottom" : "top"} sideOffset={8} className="whitespace-nowrap rounded-md font-semibold bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg max-w-md">
                                                    <p>{t("tooltipExportToJsonFavorites", {page: page})}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                                {!(filterTextFavorites && favoritesSpecies.length === 0) && (
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
                                                {hasFavoritesSpeciesInCurrentPage && (
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

                                        {favoritesArray.length === 0 || !hasFavoritesSpeciesInCurrentPage ? (
                                            <CardContent className="flex items-center justify-center p-6 text-center border-t">
                                                <p className="text-lg font-bold">{t('noFavorites', {page: page})}</p>
                                            </CardContent>
                                        ) : (
                                            <>
                                                <CardContent className="relative z-10 p-0">
                                                    <ul className="divide-y divide-border/30">
                                                        {paginatedFavorites.map((s) => (
                                                            <li
                                                                key={s.url}
                                                                onClick={() => handleRowClick(s)}
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
                                                                                    className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-[500] border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden"
                                                                                >
                                                                                    <span className="font-semibold truncate">{s.name}</span>
                                                                                </Badge>
                                                                            </div>

                                                                            <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                                <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                    <ListFilter  className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden"
                                                                                >
                                                                                    <span className="font-semibold truncate">{s.classification}</span>
                                                                                </Badge>
                                                                            </div>

                                                                            <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                                <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                    <CheckSquare  className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden" // Aggiunto overflow-hidden
                                                                                >
                                                                                    <span className="font-semibold truncate">{s.designation}</span>
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
                                                                                    <span className="font-semibold truncate">{s.average_height}</span>
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                                                                                <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/30 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-all duration-300 group-hover:scale-110">
                                                                                    <Clock className="h-3 w-3 text-gray-600 dark:text-gray-400"/>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium border-0 shadow-none group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300 overflow-hidden" // Aggiunto overflow-hidden
                                                                                >
                                                                                    <span className="font-semibold truncate">{s.average_lifespan}</span>
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
                                                                            const id = s.url?.split('/').slice(-1)[0];
                                                                            if (id) toggleFavoriteSpecies(id);
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
                                                            current: `${startIndexFavorites + 1}-${Math.min(startIndexFavorites + ITEMS_PER_PAGE, favoritesSpecies.length)}`,
                                                            total: favoritesSpecies.length
                                                        })}
                                                    </div>
                                                    {favoritesSpecies.length > ITEMS_PER_PAGE && (
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
                                {filterTextFavorites && favoritesSpecies.length === 0 && (
                                    <p className="text-center text-destructive text-sm mt-4">{t('noFavoritesMatchFilter')}</p>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
                <SpeciesDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    species={selectedSpecies}
                />
            </div>
        </PageTransitionWrapper>
    );
}