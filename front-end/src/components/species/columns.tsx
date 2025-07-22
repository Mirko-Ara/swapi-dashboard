import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import type {Species} from '@/types';
import {FavoriteTableCell} from '@/components/users/favorite-table-cell';
import {rankItem} from "@tanstack/match-sorter-utils";


const SPECIES_KEY = 'SPECIES' as const;

export const fuzzyFilter: FilterFn<Species> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({
        itemRank,
    });
    return itemRank.passed;
};

export const columns: ColumnDef<Species>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('speciesName');
        },
        cell: ({ row }) => {
            const id = row.original.url.split('/').slice(-1)[0];
            return <FavoriteTableCell id={id} name={row.original.name} favoritesKey={SPECIES_KEY}/>
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
        filterFn: fuzzyFilter,
    },
    {
        accessorKey: 'classification',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('classification');
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
        filterFn: fuzzyFilter,
    },
    {
        accessorKey: 'designation',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('designation');
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
        filterFn: fuzzyFilter,
    },
    {
        accessorKey: 'average_height',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('averageHeight');
        },
        enableSorting: true,
        sortingFn: 'basic',
        filterFn: fuzzyFilter,
    },
    {
        accessorKey: 'average_lifespan',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('averageLifespan');
        },
        enableSorting: true,
        sortingFn: 'basic',
        filterFn: fuzzyFilter,
    }
];