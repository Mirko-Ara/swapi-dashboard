import type { FilterFn } from '@tanstack/react-table';
import { columns } from './columns';
import type { Starship } from '@/types';
import { useState } from 'react';
import { LogWatcher } from '@/components/layout/log-watcher';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/data-table';
import {StarshipDetailsModal} from "@/components/starships/starship-details-modal";
import { useStarshipsLogWatcher } from '@/context/log-watcher-instances';

const globalFilterFn: FilterFn<Starship> = (row, _columnId, filterValue) => {
    const filter = String(filterValue).toLowerCase().trim();
    const { name, model, manufacturer, cargo_capacity } = row.original;

    const startsWith = (val: string | number | null | undefined) => {
        if (val == null) return false;
        return val.toString().toLowerCase().startsWith(filter);
    };

    return (
        startsWith(name) ||
        startsWith(model) ||
        startsWith(manufacturer) ||
        startsWith(cargo_capacity)
    );
};

interface StarshipsTableProps {
    data: Starship[];
    isLoading?: boolean;
}

export const StarshipsTable = ({ data, isLoading = false }: StarshipsTableProps) => {
    const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();

    const handleRowClick = (starship: Starship) => {
        setSelectedStarship(starship);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStarship(null);
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <LogWatcher className="h-[400px]" useWatcherHook={useStarshipsLogWatcher}/>
            </div>
        );
    }

    return (
        <>
            <DataTable<Starship>
                data={data}
                columns={columns}
                globalFilterFn={globalFilterFn}
                filterPlaceholder={t('filterStarshipsPlaceholder')}
                onRowClick={handleRowClick}
                clickDetailsTooltip={t('clickToViewStarshipDetails')}
            />
            <StarshipDetailsModal
                starship={selectedStarship}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </>
    );
};