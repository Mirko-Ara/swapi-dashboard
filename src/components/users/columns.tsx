import type { ColumnDef } from '@tanstack/react-table'
import type {Person} from '@/types';
import {FavoriteTableCell} from '@/components/users/favorite-table-cell';
const PEOPLE_KEY = 'PEOPLE' as const;
export const columns: ColumnDef<Person>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('name');
        },
        cell: ({ row }) => {
            const id = row.original.url.split('/').slice(-1)[0];
            return <FavoriteTableCell id={id} name={row.original.name} favoritesKey={PEOPLE_KEY}/>;
        },
        enableSorting: true,
    },
    {
        accessorKey: 'gender',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('gender');
        },
        cell: ({ row }) => <div className="capitalize">{row.getValue('gender')}</div>,
        enableSorting: true,
    },
    {
        accessorKey: 'birth_year',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('birthYear')
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
    },
    {
        accessorKey: 'height',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('height');
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
    },
];