"use client"
import { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '@/store/store-index';
import { setTheme as setReduxTheme } from '@/store/theme-slice';


type Theme = "dark" | "light" | "system";


export const useTheme = () => {
    const dispatch = useDispatch<AppDispatch>();
    const theme = useSelector((state: RootState) => state.theme.theme);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if(theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
            return;
        }
        root.classList.add(theme);
    }, [theme]);
    return {
        theme,
        setTheme: (newTheme: Theme) => dispatch(setReduxTheme(newTheme)),
    };
}