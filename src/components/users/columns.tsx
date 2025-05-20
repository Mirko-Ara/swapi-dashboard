import type { ColumnDef } from '@tanstack/react-table'
import type {Person} from '@/types';
import {FavoriteTableCell} from '@/components/users/favorite-table-cell';
export const columns: ColumnDef<Person>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
            const id = row.original.url.split('/').slice(-1)[0];
            return <FavoriteTableCell id={id} name={row.original.name}/>;
        },
    },
    {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ row }) => <div className="capitalize">{row.getValue('gender')}</div>
    },
    {
        accessorKey: 'birth_year',
        header: 'Birth Year',
    },
    {
        accessorKey: 'height',
        header: 'Height (cm)',
    },
];