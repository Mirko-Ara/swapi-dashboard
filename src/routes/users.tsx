import {useSwapiPeople} from '../hooks/use-swapi';
import {UsersTable} from '../components/users/users-table';
import {LogWatcher} from '@/components/layout/log-watcher';
import {useTranslation} from 'react-i18next';
import {useState, useMemo} from "react";
import {useFavorites} from "@/hooks/use-favorites";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@radix-ui/react-tabs";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@radix-ui/react-scroll-area";
import {X, ChevronLeft, ChevronRight} from "lucide-react";
import {Input} from "@/components/ui/input";

const ITEMS_PER_PAGE = 5;

const Users = () => {
    const {data, isLoading} = useSwapiPeople();
    const {t} = useTranslation();
    const [activeTab, setActiveTab] = useState("all");
    const {favorites, favoritesArray, toggleFavorite, clearAll} = useFavorites();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterText, setFilterText] = useState("");
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
    }, [data, favorites, filterText])

    const totalPages = useMemo(() => Math.ceil(favoriteUsers.length / ITEMS_PER_PAGE), [favoriteUsers.length]);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedFavorites = useMemo(() => favoriteUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE), [favoriteUsers, startIndex]);

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handleFilterChange = (input: string) => {
        const filtered = input.replace(/[^\w\s-/]/gi, '');
        setFilterText(filtered);
        setCurrentPage(1);
    }
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
                    {isLoading ? (
                        <div className="p-4 text-center">
                            <LogWatcher className="h-[300px]"/>
                        </div>
                    ) : (
                        <UsersTable data={data || []}/>
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
                                <Card className="border shadow-md bg-muted/70">
                                    <CardHeader className="pb-2 px-4">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xl font-bold tracking-tight px-0">
                                                <span className="-mt-5 flex items-center gap-2 text-primary/90">
                                                    {t('favorites')}
                                                </span>
                                            </CardTitle>
                                            {favoritesArray.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="border-none cursor-pointer h-8 -mr-3 -mt-4 px-2 hover:bg-destructive/10 hover:text-destructive transition-all text-xs sm:text-sm sm:px-4"
                                                    onClick={clearAll}
                                                >
                                                    {t('clearAll')}
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>

                                    {favoritesArray.length === 0 ? (
                                        <CardContent className="py-4 text-center text-muted-foreground border-t">
                                            {t('noFavorites')}
                                        </CardContent>
                                    ) : (
                                        <>
                                            <CardContent className="pt-0 pb-0 px-0">
                                                <ScrollArea className="max-h-[220px]">
                                                    <ul className="divide-y divide-border">
                                                        {paginatedFavorites.map((person) => (
                                                            <li
                                                                key={person.url}
                                                                className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors group border-l-2 border-l-transparent hover:border-l-primary"
                                                            >
                                                                <div className="w-[90%] overflow-x-auto scrollbar-thin pr-4 pb-3" style={{ scrollBehavior: "smooth" }}>
                                                                    <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-6 min-w-max">
                                                                        <span className="font-medium text-primary/90 whitespace-nowrap">
                                                                          {person.name}
                                                                        </span>

                                                                        <span className="font-medium text-primary/90 whitespace-nowrap">
                                                                            {t("gender")}<span className="font-medium ml-1 text-muted-foreground">: {person.gender === "n/a"
                                                                            ? person.gender.toUpperCase()
                                                                            : (["male", "female", "hermaphrodite", "none"].includes(person.gender)
                                                                                ? t(person.gender).charAt(0).toUpperCase() + t(person.gender).slice(1).toLowerCase()
                                                                                : "")}</span>
                                                                        </span>
                                                                        {person.birth_year && (
                                                                            <span className="font-medium text-primary/90 whitespace-nowrap">
                                                                                {t("birthYear")}<span className="font-medium ml-1 text-muted-foreground">: {person.birth_year}</span>
                                                                            </span>
                                                                        )}

                                                                        {person.height && (
                                                                            <span className="font-medium text-primary/90 whitespace-nowrap">
                                                                                {t("height")}
                                                                                <span className="font-medium ml-1 text-muted-foreground">: {person.height} cm</span>
                                                                            </span>
                                                                        )}

                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="cursor-pointer h-7 w-7 p-0 opacity-70 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                                                    onClick={() => {
                                                                        const id = person.url?.split('/').slice(-1)[0];
                                                                        if (id) toggleFavorite(id);
                                                                    }}
                                                                >
                                                                    <X className="h-3.5 w-3.5"/>
                                                                    <span
                                                                        className="sr-only">{t('removeFromFavorites')}</span>
                                                                </Button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                            </CardContent>

                                            {favoriteUsers.length > ITEMS_PER_PAGE && (
                                                <CardFooter
                                                    className="mt-20 flex justify-between items-center px-4 py-2 border-t bg-muted/50">
                                                    <div className="text-xs text-muted-foreground font-bold">
                                                        {t("pageInfo", {
                                                            current: `${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, favoriteUsers.length)}`,
                                                            total: favoriteUsers.length
                                                        })}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7"
                                                            disabled={currentPage === 1}
                                                            onClick={prevPage}
                                                        >
                                                            <ChevronLeft className="h-4 w-4"/>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer h-7 w-7"
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
        </div>
    );
};

export default Users;