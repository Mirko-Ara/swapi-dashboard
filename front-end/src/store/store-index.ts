import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './theme-slice';
import authReducer from './auth-slice';
import peopleLogWatcherReducer  from './people-log-watcher-slice';
import starshipsLogWatcherReducer from './starships-log-watcher-slice';
import speciesLogWatcherReducer from './species-log-watcher-slice';
import settingsReducer from './settings-slice';

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        auth: authReducer,
        peopleLogWatcher: peopleLogWatcherReducer ,
        starshipsLogWatcher: starshipsLogWatcherReducer,
        speciesLogWatcher: speciesLogWatcherReducer,
        settings: settingsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;