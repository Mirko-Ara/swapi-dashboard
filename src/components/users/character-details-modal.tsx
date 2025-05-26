import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {User, Calendar, Ruler, Eye, Palette, Weight } from 'lucide-react';
import type { Person } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import React from "react";
import {useFavorites} from "@/hooks/use-favorites.tsx";

interface CharacterDetailsModalProps {
    character: Person | null;
    isOpen: boolean;
    onClose: () => void;
}

type DetailItem = {
    icon: React.ElementType;
    label: string;
    value: string | number | null;
    color: string;
};
const DetailCard: React.FC<{detail: DetailItem }> = ({ detail}) => {
    const Icon = detail.icon;
    return (
        <Card className="transition-all duration-200 ease-out hover:shadow-xl hover:scale-105">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4"/>
                    {detail.label}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <Badge
                    variant="secondary"
                    className={`${detail.color} capitalize text-sm px-3 py-1`}
                >
                    {detail.value || 'Unknown'}
                </Badge>
            </CardContent>
        </Card>
    );
};

export const CharacterDetailsModal = ({character, isOpen, onClose}: CharacterDetailsModalProps) => {
    const { favorites  } = useFavorites();
    const isFavorite = favorites[character?.url?.split('/').pop() || ''];
    if(!character) return null;

    const details: DetailItem[] = [
        {
            icon: User,
            label: 'Name',
            value: character.name,
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        },
        {
            icon: Palette,
            label: 'Gender',
            value: character.gender,
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        },
        {
            icon: Calendar,
            label: 'Birth Year',
            value: character.birth_year,
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        },
        {
            icon: Ruler,
            label: 'Height',
            value: character.height ? `${character.height} cm` : 'Unknown',
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        },
        {
            icon: Weight,
            label: 'Mass',
            value: character.mass ? `${character.mass} kg` : 'Unknown',
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        },
        {
            icon: Eye,
            label: 'Eye Color',
            value: character.eye_color,
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        },
        {
            icon: Palette,
            label: 'Hair Color',
            value: character.hair_color,
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        },
        {
            icon: Palette,
            label: 'Skin Color',
            value: character.skin_color,
            color: 'bg-gray-500/10 text-gray-800 dark:text-gray-200'
        }
    ];
    return (
        <Dialog open={isOpen}  onOpenChange={onClose}>
            <DialogContent className="rounded-3xl max-w-xs md:max-w-lg lg:max-w-xl max-h-[90vh] scrollbar-thin overflow-y-auto p-6 sm:p-8 shadow-xl dark:shadow-zinc-800/70">
                <DialogHeader className="pb-4 border-b border-gray-200/70 dark:border-gray-700/70 mb-4">
                    <DialogTitle className="flex items-center justify-between text-2xl font-bold py-2">
                        <span>{character.name} {isFavorite ? '❤️' : '🤍'}</span>
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 mt-4">
                    {details.map((detail, index) => (
                        <DetailCard key={index} detail={detail} />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};