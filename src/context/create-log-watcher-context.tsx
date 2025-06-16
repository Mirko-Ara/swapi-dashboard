import {createContext, useState, useContext, useEffect, useRef, type ReactNode, useMemo, useCallback} from 'react';
import * as React from "react";
import { useTranslation } from "react-i18next";

export interface LogWatcherContextType {
    currentPage: number | null;
    totalPages: number | null;
    fetchingMessage: string;
    resetLogWatcher: () => void;
}

export type LogFilterId = "PEOPLE" | "STARSHIPS";

interface Setters {
    setCurrentPage: React.Dispatch<React.SetStateAction<number | null>>;
    setTotalPages: React.Dispatch<React.SetStateAction<number | null>>;
    setFetchingMessage: React.Dispatch<React.SetStateAction<string>>;
}

export function createLogWatcherContext(filterId: LogFilterId) {
    const Context = createContext<LogWatcherContextType>({
        currentPage: null,
        totalPages: null,
        fetchingMessage: "",
        resetLogWatcher: () => {},
    });

    const useLogWatcher = () => useContext(Context);

    const LogWatcherProvider = ({ children }: { children: ReactNode }) => {
        const { i18n } = useTranslation();
        const [currentPage, setCurrentPage] = useState<number | null>(null);
        const [totalPages, setTotalPages] = useState<number | null>(null);
        const [fetchingMessage, setFetchingMessage] = useState<string>("");

        const setters: Setters = useMemo(() => ({ setCurrentPage, setTotalPages, setFetchingMessage}), []);
        const originalConsoleLogRef = useRef<typeof console.log | null>(null);
        const languageRef = useRef<string>(i18n.language);
        const resetLogWatcher = useCallback(() => {
            setCurrentPage(null);
            setTotalPages(null);
            setFetchingMessage("");
        }, []);

        useEffect(() => {
            if(!originalConsoleLogRef.current) {
                originalConsoleLogRef.current = console.log;
            }

            if (languageRef.current !== i18n.language) {
                languageRef.current = i18n.language;
            }
            console.log = function (...args) {
                if (originalConsoleLogRef.current) {
                    originalConsoleLogRef.current.apply(console, args);
                }
                const message = args[0];
                if (typeof message !== "string") return;
                if(message.startsWith(`SWAPI_FETCH_PAGE:${filterId}:`)) {
                    try {
                         const parts = message.split(":");
                         if(parts.length >= 4) {
                             const page = parseInt(parts[2], 10);
                             const total = parseInt(parts[3], 10);

                             if(!isNaN(page) && !isNaN(total)) {
                                 setters.setCurrentPage(page);
                                 setters.setTotalPages(total);
                                 const translatedMessage = i18n.t("fetchingPage", { page, type: filterId === "STARSHIPS" ? i18n.t("starships") : i18n.t("characters"), total});
                                 setters.setFetchingMessage(translatedMessage);
                             }
                         }
                    } catch(error) {
                        console.error(`Error parsing SWAPI_FETCH_PAGE log for ${filterId}:`, error);
                    }
                    return;
                }
            };

            return () => {
                if ( originalConsoleLogRef.current) {
                    console.log = originalConsoleLogRef.current;
                }
            };
        }, [i18n.language, i18n, setters]);
        return (
            <Context.Provider value={{ currentPage, totalPages, fetchingMessage, resetLogWatcher }}>
                {children}
            </Context.Provider>
        );
    };
    return { Context, useLogWatcher, LogWatcherProvider};
}