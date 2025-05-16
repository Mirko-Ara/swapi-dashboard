import type { ColumnDef } from '@tanstack/react-table'
import type {Person} from '@/types';
export const columns: ColumnDef<Person>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="capitalize">{row.getValue('name')}</div>
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