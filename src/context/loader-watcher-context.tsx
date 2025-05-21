import { createContext, useState, useContext, useEffect, useRef, type ReactNode } from 'react';
import * as React from "react";
import { useTranslation } from "react-i18next";

interface LogWatcherContextType {
    currentPage: number | null;
    fetchingMessage: string;
    setCurrentPage: React.Dispatch<React.SetStateAction<number | null>>;
    setFetchingMessage: React.Dispatch<React.SetStateAction<string>>;
}

const LogWatcherContext = createContext<LogWatcherContextType>({
    currentPage: null,
    fetchingMessage: "",
    setCurrentPage: () => {},
    setFetchingMessage: () => {}
});

export const useLogWatcher = () => useContext(LogWatcherContext);

export const LogWatcherProvider = ({ children }: { children: ReactNode }) => {
    const { i18n } = useTranslation();
    const [currentPage, setCurrentPage] = useState<number | null>(null);
    const [fetchingMessage, setFetchingMessage] = useState<string>("");

    // Cache per evitare ricalcoli
    const regexCache = useRef<RegExp | null>(null);
    const languageRef = useRef<string>(i18n.language);

    useEffect(() => {
        // Reset della regex quando cambia la lingua
        if (languageRef.current !== i18n.language) {
            regexCache.current = null;
            languageRef.current = i18n.language;
        }

        const originalConsoleLog = console.log;
        console.log = function (...args) {
            originalConsoleLog.apply(console, args);
            const message = args[0];
            if (typeof message !== "string") return;

            // Gestione veloce per il formato specifico
            if (message.startsWith("SWAPI_FETCH_PAGE:")) {
                try {
                    const parts = message.split(":");
                    if (parts.length >= 3) {
                        const page = parseInt(parts[1], 10);
                        const total = parts[2];

                        if (!isNaN(page)) {
                            setCurrentPage(page);
                            const translatedMessage = i18n.t("fetchingPage", {
                                page,
                                total
                            });
                            setFetchingMessage(translatedMessage);
                        }
                    }
                } catch (error) {
                    console.error("Error parsing page number:", error);
                }
                return;
            }
            // Crea la regex solo se necessario e cachela
            if (!regexCache.current) {
                const template = i18n.getResource(i18n.language, "translation", "fetchingPage") as string;
                if (template) {
                    const pattern = template
                        .replace(/\.\.\./g, "\\.\\.\\.")
                        .replace(/{{page}}/g, "(\\d+)")
                        .replace(/{{total}}/g, "(\\d+)");
                    regexCache.current = new RegExp(pattern);
                }
            }

            // Usa la regex cachata
            if (regexCache.current) {
                const match = message.match(regexCache.current);
                if (match && match[1]) {
                    try {
                        const page = parseInt(match[1]);
                        setCurrentPage(page);
                        setFetchingMessage(message);
                    } catch (error) {
                        console.error("Error parsing page number:", error);
                    }
                }
            }
        };

        return () => {
            console.log = originalConsoleLog;
        };
    }, [i18n, i18n.language]);

    return (
        <LogWatcherContext.Provider value={{
            currentPage,
            fetchingMessage,
            setCurrentPage,
            setFetchingMessage
        }}>
            {children}
        </LogWatcherContext.Provider>
    );
};