import {
    type FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { columns } from './columns';
import type { Person } from '@/types';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { LogWatcher } from '@/components/layout/log-watcher';
import { useTranslation } from 'react-i18next';

const globalFilterFn: FilterFn<Person> = (row, _columnId, filterValue) => {
    const filter = String(filterValue).toLowerCase().trim();
    const { name, gender, birth_year, height } = row.original;

    const startsWith = (val: string | number | null | undefined) => {
        if (val == null) return false;
        return val.toString().toLowerCase().startsWith(filter);
    };

    return (
        startsWith(name) ||
        startsWith(gender) ||
        startsWith(birth_year) ||
        startsWith(height)
    );
};

interface UsersTableProps {
    data: Person[];
    isLoading?: boolean;
}

export const UsersTable = ({ data, isLoading = false }: UsersTableProps) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const { t } = useTranslation();

    const table = useReactTable({
        data,
        columns,
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

    if (isLoading) {
        return (
            <div className="space-y-4">
                <LogWatcher className="h-[400px]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full space-y-4">
                <div className="flex items-center py-4">
                    <Input
                        placeholder={t('filterPlaceholder')}
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

                        <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => setGlobalFilter('')}>
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
};
