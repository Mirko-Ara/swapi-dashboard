import type { Store } from '@reduxjs/toolkit';
import {
    setPeopleCurrentPage,
    setPeopleTotalPages,
    setPeopleFetchingMessage,
} from '@/store/people-log-watcher-slice';
import {
    setStarshipsCurrentPage,
    setStarshipsTotalPages,
    setStarshipsFetchingMessage,
} from '@/store/starships-log-watcher-slice';
import i18n from '../i18n';
import type { RootState, AppDispatch } from '@/store/store-index';

const originalConsoleLogFunction = window.console.log.bind(window.console);
const originalConsoleErrorFunction = window.console.error.bind(window.console);
const originalConsoleWarnFunction = window.console.warn.bind(window.console);
const originalConsoleInfoFunction = window.console.info.bind(window.console);

let isInterceptorInitialized = false;

const logActionsMap = {
    PEOPLE: {
        setCurrentPage: setPeopleCurrentPage,
        setTotalPages: setPeopleTotalPages,
        setFetchingMessage: setPeopleFetchingMessage,
        typeLabel: 'characters',
    },
    STARSHIPS: {
        setCurrentPage: setStarshipsCurrentPage,
        setTotalPages: setStarshipsTotalPages,
        setFetchingMessage: setStarshipsFetchingMessage,
        typeLabel: 'starships',
    },
};

export const initializeLogInterceptor = (store: Store<RootState, ReturnType<AppDispatch>>) => {
    if (isInterceptorInitialized) {
        originalConsoleWarnFunction("Log interceptor already initialized. Skipping.");
        return;
    }

    isInterceptorInitialized = true;
    console.log = function (...args) {
        originalConsoleLogFunction(...args);

        const message = args[0];
        if (typeof message !== "string") return;

        if (message.startsWith("SWAPI_FETCH_PAGE:")) {
            try {
                const content = message.substring("SWAPI_FETCH_PAGE:".length);
                const parts = content.split(":");
                if (parts.length >= 3) {
                    const filterId = parts[0] as 'PEOPLE' | 'STARSHIPS';
                    const page = parseInt(parts[1], 10);
                    const total = parseInt(parts[2], 10);

                    const actions = logActionsMap[filterId];

                    if (actions && !isNaN(page) && !isNaN(total)) {
                        const typedDispatch = store.dispatch as AppDispatch;
                        typedDispatch(actions.setCurrentPage(page));
                        typedDispatch(actions.setTotalPages(total));

                        const translatedMessage = i18n.t("fetchingPage", {
                            page,
                            type: i18n.t(actions.typeLabel),
                            total
                        });
                        typedDispatch(actions.setFetchingMessage(translatedMessage));
                    }
                }
            } catch (error) {
                originalConsoleErrorFunction(`Error parsing SWAPI_FETCH_PAGE log:`, error);
            }
        }
    };
    console.error = function (...args) {
        originalConsoleErrorFunction(...args);
    };
    console.warn = function (...args) {
        originalConsoleWarnFunction(...args);
    };
    console.info = function (...args) {
        originalConsoleInfoFunction(...args);
    };
};