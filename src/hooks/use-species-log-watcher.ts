"use client";
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '@/store/store-index';
import {
    resetSpeciesLogWatcher,
} from '@/store/species-log-watcher-slice';
import { type LogWatcherContextType } from '@/store/species-log-watcher-slice';

export const useSpeciesLogWatcher = (): LogWatcherContextType => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentPage, totalPages, fetchingMessage } = useSelector(
        (state: RootState) => state.speciesLogWatcher
    );

    return {
        currentPage,
        totalPages,
        fetchingMessage,
        resetLogWatcher: () => dispatch(resetSpeciesLogWatcher()),
    };
};