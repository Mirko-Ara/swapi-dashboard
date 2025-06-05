import {
    type ColumnDef,
    type FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';

interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData>[];
    globalFilterFn: FilterFn<TData>;
    filterPlaceholder: string;
    onRowClick?: (row: TData) => void;
    clickDetailsTooltip?: string;
}

export function DataTable<TData>({
     data,
     columns,
     globalFilterFn,
     filterPlaceholder,
     onRowClick,
     clickDetailsTooltip,
 }: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const { t } = useTranslation();

    const translatedColumns = useMemo(() => {
        return columns.map(column => {
            return {
                ...column,
                meta: {
                    ...(column.meta || {}),
                    t: t,
                }
            };
        });
    }, [columns, t]);

    const table = useReactTable({
        data,
        columns: translatedColumns,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
        state: {
            sorting,
            globalFilter,
        },
    });

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full space-y-4">
                <div className="flex items-center py-4">
                    <Input
                        placeholder={filterPlaceholder}
                        value={globalFilter}
                        onChange={(event) => {
                            const input = event.target.value;
                            const filtered = input.replace(/[^\w\s-/]/gi, '');
                            setGlobalFilter(filtered);
                        }}
                        className="max-w-sm"
                    />
                </div>

                {globalFilter && (
                    <div className="mb-2 text-sm flex items-center justify-between px-1 text-muted-foreground animate-fade-in">
                        <span
                            className={
                                table.getFilteredRowModel().rows.length === 0 ? 'text-destructive' : ''
                            }
                        >
                            {table.getFilteredRowModel().rows.length > 0
                                ? t('matchesFound', { count: table.getFilteredRowModel().rows.length })
                                : t('noResultsFound')}
                        </span>

                        <Button className="cursor-pointer hover:text-destructive " variant="ghost" size="sm" onClick={() => setGlobalFilter('')}>
                            {t("clearFilter")}
                        </Button>
                    </div>
                )}

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() ? 'selected' : undefined}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                                        title={clickDetailsTooltip}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        {t("noResultsFound")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col items-center sm:flex-row sm:justify-between px-2">
                    <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
                        {t("pageInfo", {
                            current: ` ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                data.length
                            )}`,
                            total: data.length,
                        })}
                    </div>

                    <div className="flex flex-row space-x-2">
                        <Button
                            variant="ghost"
                            className="cursor-pointer border-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            {t("previous")}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer border-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            {t("next")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}