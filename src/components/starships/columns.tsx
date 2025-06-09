import type { ColumnDef } from '@tanstack/react-table';
import type { Starship } from '@/types';
import { FavoriteTableCell } from '@/components/users/favorite-table-cell';

const STARSHIP_KEY = 'STARSHIPS';
export const columns: ColumnDef<Starship>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('starshipName');
        },
        cell: ({ row }) => {
            const id = row.original.url.split('/').slice(-1)[0];
            return <FavoriteTableCell id={id} name={row.original.name} favoritesKey={STARSHIP_KEY}/>;
        },
    },
    {
        accessorKey: 'model',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('starshipModel');
        },
    },
    {
        accessorKey: 'manufacturer',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipManufacturer');
        },
    },
    {
        accessorKey: 'passengers',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipPassengers');
        },
    },
    {
        accessorKey: 'cargo_capacity',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipCargoCapacity');
        },
    },
    {
        accessorKey: 'max_atmosphering_speed',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipMaxAtmospheringSpeed');
        },
    },
];