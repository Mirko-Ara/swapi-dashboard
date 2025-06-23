import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type LogWatcherState} from "@/store/people-log-watcher-slice";

const initialState: LogWatcherState = {
    currentPage: null,
    totalPages: null,
    fetchingMessage: "",
};
export interface LogWatcherContextType {
    currentPage: number | null;
    totalPages: number | null;
    fetchingMessage: string;
    resetLogWatcher: () => void;
}

const starshipsLogWatcherSlice = createSlice({
    name: 'starshipsLogWatcher',
    initialState,
    reducers: {
        setStarshipsCurrentPage: (state, action: PayloadAction<number | null>): void => {
            state.currentPage = action.payload;
        },
        setStarshipsTotalPages: (state, action: PayloadAction<number | null>): void => {
            state.totalPages = action.payload;
        },
        setStarshipsFetchingMessage: (state, action: PayloadAction<string>): void => {
            state.fetchingMessage = action.payload;
        },
        resetStarshipsLogWatcher: (state): void => {
            state.currentPage = null;
            state.totalPages = null;
            state.fetchingMessage = "";
        },
    },
});
export const {
    setStarshipsCurrentPage,
    setStarshipsTotalPages,
    setStarshipsFetchingMessage,
    resetStarshipsLogWatcher,
} = starshipsLogWatcherSlice.actions;

export default starshipsLogWatcherSlice.reducer;