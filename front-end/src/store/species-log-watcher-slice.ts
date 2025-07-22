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

const speciesLogWatcherSlice = createSlice({
    name: 'speciesLogWatcher',
    initialState,
    reducers: {
        setSpeciesCurrentPage: (state, action: PayloadAction<number | null>): void => {
            state.currentPage = action.payload;
        },
        setSpeciesTotalPages: (state, action: PayloadAction<number | null>): void => {
            state.totalPages = action.payload;
        },
        setSpeciesFetchingMessage: (state, action: PayloadAction<string>): void => {
            state.fetchingMessage = action.payload;
        },
        resetSpeciesLogWatcher: (state): void => {
            state.currentPage = null;
            state.totalPages = null;
            state.fetchingMessage = "";
        },
    },
});
export const {
    setSpeciesCurrentPage,
    setSpeciesTotalPages,
    setSpeciesFetchingMessage,
    resetSpeciesLogWatcher,
} = speciesLogWatcherSlice.actions;

export default speciesLogWatcherSlice.reducer;