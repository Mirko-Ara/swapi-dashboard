import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import * as React from "react";


interface LogWatcherContextType {
    currentPage: number | null;
    fetchingMessage: string;
    setCurrentPage: React.Dispatch<React.SetStateAction<number | null>>;
    setFetchingMessage: React.Dispatch<React.SetStateAction<string>>;
}

const LogWatcherContext = createContext<LogWatcherContextType>({
    currentPage: null,
    fetchingMessage: "Loading data...",
    setCurrentPage: () => {},
    setFetchingMessage: () => {}
});

export const useLogWatcher = () => useContext(LogWatcherContext);

export const LogWatcherProvider = ({ children }: {children: ReactNode}) => {
    const [currentPage, setCurrentPage] = useState<number | null>(null);
    const [fetchingMessage, setFetchingMessage] = useState<string>("Loading data...");

    useEffect(() => {
        const originalConsoleLog = console.log;
        console.log = function( ...args) {
            originalConsoleLog.apply(console, args);
            const message = args[0];
            if( typeof message === "string" && message.includes("Fetching page") ) {
                try {
                    const pageMatch = message.match(/Fetching page (\d+)/);
                    if(pageMatch && pageMatch[1]) {
                        const page = parseInt(pageMatch[1]);
                        setCurrentPage(page);
                        setFetchingMessage(`Fetching page ${page} of 9...`);
                    }
                } catch(error) {
                    originalConsoleLog.apply(console, ["Error during page parsing: ", error]);

                }
            }
        }
        return () => {
            console.log = originalConsoleLog;
        }
    }, []);

    return (
        <LogWatcherContext.Provider value={{ currentPage, fetchingMessage, setCurrentPage, setFetchingMessage}}>
            {children}
        </LogWatcherContext.Provider>
    );
}