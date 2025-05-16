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
        <div className="w-full space-y-4">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by name..."
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
                ? `${table.getFilteredRowModel().rows.length} ${
                    table.getFilteredRowModel().rows.length === 1 ? 'match' : 'matches'
                } found`
                : 'No results found.'}
          </span>

                    <Button variant="ghost" size="sm" onClick={() => setGlobalFilter('')}>
                        ✕ Clear filter
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
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Showing{' '}
                    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        data.length
                    )}{' '}
                    of {data.length} results
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};
