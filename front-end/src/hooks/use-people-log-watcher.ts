"use client";
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '@/store/store-index';
import {
    resetPeopleLogWatcher,
} from '@/store/people-log-watcher-slice';
import { type LogWatcherContextType } from '@/store/people-log-watcher-slice';

export const usePeopleLogWatcher = (): LogWatcherContextType => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentPage, totalPages, fetchingMessage } = useSelector(
        (state: RootState) => state.peopleLogWatcher
    );

    return {
        currentPage,
        totalPages,
        fetchingMessage,
        resetLogWatcher: () => dispatch(resetPeopleLogWatcher()),
    };
};