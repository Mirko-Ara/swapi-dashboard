import type { ColumnDef } from '@tanstack/react-table';
import type { Starship } from '@/types';

export const columns: ColumnDef<Starship>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('starshipName');
        },
        cell: ({ row }) => {
            return <div>{row.original.name}</div>;
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