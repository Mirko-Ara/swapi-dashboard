import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface LogWatcherState {
    currentPage: number | null;
    totalPages: number | null;
    fetchingMessage: string;
}

export interface LogWatcherContextType {
    currentPage: number | null;
    totalPages: number | null;
    fetchingMessage: string;
    resetLogWatcher: () => void;
}

const initialState: LogWatcherState = {
    currentPage: null,
    totalPages: null,
    fetchingMessage: ","
};

const peopleLogWatcherSlice = createSlice({
    name: 'peopleLogWatcher',
    initialState,
    reducers: {
        setPeopleCurrentPage: (state, action: PayloadAction<number | null>) => {
            return void (state.currentPage = action.payload);
        },
        setPeopleTotalPages: (state, action: PayloadAction<number | null>) => {
            return void (state.totalPages = action.payload);
        },
        setPeopleFetchingMessage: (state, action: PayloadAction<string>) => {
            return void (state.fetchingMessage = action.payload);
        },
        resetPeopleLogWatcher: (state) => {
            state.currentPage = null;
            state.totalPages = null;
            state.fetchingMessage = "";
        },
    },
});
export const {
    setPeopleCurrentPage,
    setPeopleTotalPages,
    setPeopleFetchingMessage,
    resetPeopleLogWatcher
} = peopleLogWatcherSlice.actions;

export default peopleLogWatcherSlice.reducer;