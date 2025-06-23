"use client";
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '@/store/store-index';
import {
    resetStarshipsLogWatcher,
} from '@/store/starships-log-watcher-slice';
import { type LogWatcherContextType } from '@/store/starships-log-watcher-slice';

export const useStarshipsLogWatcher = (): LogWatcherContextType => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentPage, totalPages, fetchingMessage } = useSelector(
        (state: RootState) => state.starshipsLogWatcher
    );

    return {
        currentPage,
        totalPages,
        fetchingMessage,
        resetLogWatcher: () => dispatch(resetStarshipsLogWatcher()),
    };
};