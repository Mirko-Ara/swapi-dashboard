import type { FilterFn } from '@tanstack/react-table';
import { columns } from './columns';
import type { Person } from '@/types';
import { useState } from 'react';
import { LogWatcher } from '@/components/layout/log-watcher';
import { CharacterDetailsModal } from './character-details-modal';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/data-table';
import { usePeopleLogWatcher } from '@/context/log-watcher-instances';

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
    const [selectedCharacter, setSelectedCharacter] = useState<Person | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();

    const handleRowClick = (character: Person) => {
        setSelectedCharacter(character);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCharacter(null);
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <LogWatcher className="h-[400px]" useWatcherHook={usePeopleLogWatcher}/>
            </div>
        );
    }

    return (
        <>
            <DataTable<Person>
                data={data}
                columns={columns}
                globalFilterFn={globalFilterFn}
                filterPlaceholder={t('filterPlaceholder')}
                onRowClick={handleRowClick}
                clickDetailsTooltip={t('clickToViewDetails')}
            />
            <CharacterDetailsModal
                character={selectedCharacter}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </>
    );
};