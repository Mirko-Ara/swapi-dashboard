import type {ColumnDef, SortingFn, FilterFn} from '@tanstack/react-table';
import type { Starship} from '@/types';
import { rankItem } from '@tanstack/match-sorter-utils';
import { FavoriteTableCell } from '@/components/users/favorite-table-cell';
import i18n from 'i18next';

const STARSHIP_KEY = 'STARSHIPS' as const;

const formatNumberForDisplay = (value: string | number | undefined | null): string => {
    const locale = i18n.language || 'en-US';
    if (value === null || value === undefined || value === "n/a" || value === "unknown" || value === "none") {
        return i18n.t("unknown");
    }
    const num = parseFloat(String(value).replace(/,/g, ''));
    if (isNaN(num)) {
        return String(value);
    }
    return new Intl.NumberFormat(locale).format(num);
};

const safeNumberSortingFn: SortingFn<Starship> = (rowA, rowB, columnId) => {
    const parseValue = (value: string | number | string[] | undefined | null): number => {
        if (value === null || value === undefined || value === "n/a" || value === "unknown" || value === "none" || value === "unlimited") {
            return -Infinity;
        }
        const num = parseFloat(String(value).replace(/,/g, ''));
        return isNaN(num) ? -Infinity : num;
    };

    const a = parseValue(rowA.getValue(columnId));
    const b = parseValue(rowB.getValue(columnId));

    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
};

export const fuzzyFilter: FilterFn<Starship> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({
        itemRank,
    });
    return itemRank.passed;
}


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
        enableSorting: true,
        sortingFn: 'alphanumeric',
        filterFn: fuzzyFilter,
    },
    {
        accessorKey: 'model',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string};
            return t('starshipModel');
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
        filterFn: fuzzyFilter,
    },
    {
        accessorKey: 'manufacturer',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipManufacturer');
        },
        enableSorting: true,
        sortingFn: 'alphanumeric',
        filterFn: fuzzyFilter,
    },
    {
        accessorKey: 'passengers',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipPassengers');
        },
        enableSorting: true,
        filterFn: fuzzyFilter,
        sortingFn: safeNumberSortingFn,
        cell: ({ row }) => {
            const value = row.original.passengers;
            return formatNumberForDisplay(value);
        }
    },
    {
        accessorKey: 'cargo_capacity',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipCargoCapacity');
        },
        enableSorting: true,
        filterFn: fuzzyFilter,
        sortingFn: safeNumberSortingFn,
        cell: ({ row }) => {
            const value = row.original.cargo_capacity;
            const formatted = formatNumberForDisplay(value);
            return formatted === i18n.t("unknown") ? formatted : `${formatted} kg`;
        }
    },
    {
        accessorKey: 'max_atmosphering_speed',
        header: ({ column }) => {
            const { t } = column.columnDef.meta as { t: (key: string) => string };
            return t('starshipMaxAtmospheringSpeed');
        },
        enableSorting: true,
        filterFn: fuzzyFilter,
        sortingFn: safeNumberSortingFn,
        cell: ({ row }) => {
            const value = row.original.max_atmosphering_speed;
            const formatted = formatNumberForDisplay(value);
            return formatted === i18n.t("unknown") ? formatted : `${formatted} km/h`;
        }
    },
];